import { flatten } from '@minko-fe/lodash-pro'
import exif from 'exif-reader'
import fg from 'fast-glob'
import fs from 'fs-extra'
import { getMetadata } from 'meta-png'
import micromatch from 'micromatch'
import mime from 'mime/lite'
import path from 'node:path'
import git from 'simple-git'
import { type ConfigurationTarget, Uri, type Webview, commands } from 'vscode'
import { type SharpNS } from '~/@types/global'
import { Config, Global, SharpOperator } from '~/core'
import { type CompressionOptions } from '~/core/compress'
import { COMPRESSED_META } from '~/core/compress/meta'
import { generateOutputPath, isPng, normalizePath } from '~/utils'
import { Log } from '~/utils/Log'
import { imageGlob } from '~/utils/glob'
import { type ImageType } from '~/webview/ImageManager'
import { CmdToVscode, CmdToWebview } from './cmd'
import { debounceUpdateVscodeConfig } from './utils'

export type VscodeMessageCenterType = typeof VscodeMessageCenter

export type KeyofMessage = keyof VscodeMessageCenterType

export type MessageType<D extends Record<string, any> = Record<string, any>, C extends KeyofMessage = any> = {
  cmd: C
  data: D
  msgId?: string
  postTime?: string
  callbackId?: string
}

type MessageMethodType<K extends KeyofMessage> = VscodeMessageCenterType[K]

export type ReturnOfMessageCenter<K extends KeyofMessage> = RmPromise<ReturnType<MessageMethodType<K>>>

type FirstParameter<F> = F extends (arg: infer A) => any ? A : never

export type FirstParameterOfMessageCenter<K extends KeyofMessage> =
  FirstParameter<MessageMethodType<K>> extends Record<string, any> ? FirstParameter<MessageMethodType<K>> : never

export const VscodeMessageCenter = {
  [CmdToVscode.ON_WEBVIEW_READY]: async () => {
    Log.debug('Webview is ready')
    const config = await VscodeMessageCenter[CmdToVscode.GET_EXT_CONFIG]()

    return {
      config,
    }
  },
  /* -------------- reload webview -------------- */
  [CmdToVscode.RELOAD_WEBVIEW]: async () => {
    const data = await commands.executeCommand('workbench.action.webview.reloadWebviewAction')
    return data
  },

  /* -------------- get all images -------------- */
  [CmdToVscode.GET_ALL_IMAGES]: async (_: any, webview: Webview) => {
    const absWorkspaceFolders = Global.rootpaths
    const workspaceFolders = absWorkspaceFolders.map((ws) => path.basename(ws))

    function _resolveDirPath(absWorkspaceFolder: string, imgPath: string) {
      if (absWorkspaceFolder === path.dirname(imgPath)) return ''
      return normalizePath(path.relative(absWorkspaceFolder, path.dirname(imgPath)))
    }

    async function _searchImgs(
      absWorkspaceFolder: string,
      webview: Webview,
      fileTypes: Set<string>,
      dirs: Set<string>,
    ) {
      absWorkspaceFolder = normalizePath(absWorkspaceFolder)

      const { allImagePatterns } = imageGlob({
        cwd: absWorkspaceFolder,
        scan: Config.file_scan,
        exclude: Config.file_exclude,
        root: Global.rootpaths,
      })

      const imgs = await fg(allImagePatterns, {
        cwd: absWorkspaceFolder,
        objectMode: true,
        dot: false,
        absolute: true,
        markDirectories: true,
        stats: true,
      })

      return Promise.all(
        imgs.map(async (img) => {
          img.path = normalizePath(img.path)
          let vscodePath = webview.asWebviewUri(Uri.file(img.path)).toString()

          // Browser doesn't support [tiff, tif], convert to png base64
          try {
            if (img.path.match(/\.(tiff?)$/i)) {
              const buffer = await Global.sharp(img.path).png().toBuffer()
              vscodePath = `data:image/png;base64,${buffer.toString('base64')}`
            }
          } catch (e) {
            Log.error(`Convert tiff to base64 error: ${e}`)
          }

          const fileType = path.extname(img.path).replace('.', '')
          fileTypes && fileTypes.add(fileType)

          const dirPath = _resolveDirPath(absWorkspaceFolder, img.path)
          dirPath && dirs.add(dirPath)

          return {
            name: img.name,
            path: img.path,
            stats: img.stats!,
            dirPath,
            absDirPath: normalizePath(path.dirname(img.path)),
            fileType,
            vscodePath,
            workspaceFolder: normalizePath(path.basename(absWorkspaceFolder)),
            absWorkspaceFolder: normalizePath(absWorkspaceFolder),
            basePath: normalizePath(path.dirname(absWorkspaceFolder)),
            extraPathInfo: path.parse(img.path),
          }
        }),
      )
    }

    try {
      const data = await Promise.all(
        absWorkspaceFolders.map(async (workspaceFolder) => {
          const fileTypes: Set<string> = new Set()
          const dirs: Set<string> = new Set()

          const imgs = await _searchImgs(workspaceFolder, webview, fileTypes, dirs)
          return {
            imgs,
            workspaceFolder: path.basename(workspaceFolder),
            absWorkspaceFolder: workspaceFolder,
            fileTypes: [...fileTypes].filter(Boolean),
            dirs: [...dirs].filter(Boolean),
          }
        }),
      )

      return {
        data,
        absWorkspaceFolders,
        workspaceFolders,
      }
    } catch {
      return {
        data: [],
        absWorkspaceFolders,
        workspaceFolders,
      }
    }
  },

  /* ------- get extension & vscode config ------ */
  [CmdToVscode.GET_EXT_CONFIG]: async () => {
    const config = Config.all

    const vscodeConfig = {
      theme: Global.theme,
      language: Global.language,
    }

    return {
      ext: config,
      vscode: vscodeConfig,
    }
  },

  /* ----------- get compressor ---------- */
  [CmdToVscode.GET_COMPRESSOR]: async () => {
    const compressor = Global.compressor
    return compressor
  },

  /* ------- open path in vscode explorer ------ */
  [CmdToVscode.OPEN_IMAGE_IN_VSCODE_EXPLORER]: (data: { filePath: string }) => {
    const res = commands.executeCommand('revealInExplorer', Uri.file(data.filePath))
    return res
  },

  /* --------- open path in os explorer -------- */
  [CmdToVscode.OPEN_IMAGE_IN_OS_EXPLORER]: async (data: { filePath: string; deep?: boolean }) => {
    const { filePath, deep = true } = data
    let targetPath = filePath
    if (deep) {
      try {
        const files = fs.readdirSync(targetPath)
        targetPath = path.join(targetPath, files[0])
      } catch {}
    }

    const res = await commands.executeCommand('revealFileInOS', Uri.file(targetPath))
    return res
  },

  /* ------------ copy image as base64 --------- */
  [CmdToVscode.COPY_IMAGE_AS_BASE64]: async (data: { filePath: string }) => {
    const { filePath } = data

    const bitmap = await fs.promises.readFile(filePath)
    const imgType = filePath.substring(filePath.lastIndexOf('.') + 1)

    const imgBase64 = `data:${mime.getType(imgType)};base64,${Buffer.from(bitmap).toString('base64')}`
    return imgBase64
  },

  /* -------------- compress image -------------- */
  [CmdToVscode.COMPRESS_IMAGE]: async (data: {
    filePaths: string[]
    option?: CompressionOptions
  }): Promise<
    | {
        filePath: string
        originSize?: number
        compressedSize?: number
        outputPath?: string
        error?: any
      }[]
    | undefined
  > => {
    try {
      const { filePaths, option } = data
      Log.info(`Compress params: ${JSON.stringify(data)}`)
      const { compressor } = Global
      const res = await compressor?.compress(filePaths, option)
      Log.info(`Compress result: ${JSON.stringify(res)}`)
      return res
    } catch (e: any) {
      Log.info(`Compress error: ${JSON.stringify(e)}`)
      return e
    }
  },

  /* -------- match glob with micromatch -------- */
  [CmdToVscode.MICROMATCH_ISMATCH]: (data: { filePaths: string[]; globs: string[] }) => {
    const { filePaths, globs } = data
    return micromatch(filePaths, globs)
  },

  /* --------- save cropper image to file -------- */
  [CmdToVscode.SAVE_CROPPER_IMAGE]: async (data: {
    dataUrl: string
    image: ImageType
  }): Promise<{ filename: string } | null> => {
    const { dataUrl, image } = data

    const [mimeType, base64] = dataUrl.split(',')

    const imageBuffer = Buffer.from(base64, 'base64')

    const outputFileType = mime.getExtension(mimeType.match(/data:(.*);/)?.[1] || '')

    const outputPath = generateOutputPath(image.path, '.crop')

    if (outputFileType !== image.fileType) {
      // 转为图片原格式
      let formatter: SharpOperator<{
        filePath: string
        ext: string
      }> = new SharpOperator({
        plugins: [
          {
            name: 'toFormat',
            hooks: {
              'before:run': async ({ sharp, runtime }) => {
                const { ext } = runtime
                sharp.toFormat(ext as keyof SharpNS.FormatEnum)
              },
              'on:generate-output-path': () => {
                return outputPath
              },
            },
          },
        ],
      })
      try {
        await formatter.run({ filePath: image.path, ext: image.fileType, input: imageBuffer })
      } finally {
        // @ts-expect-error
        formatter = null
      }
    } else {
      // 直接输出图片
      try {
        await fs.promises.writeFile(outputPath, imageBuffer)
      } catch (e) {
        Log.error(`SAVE_CROPPER_IMAGE ${e}`)
        return null
      }
    }

    const filename = path.basename(outputPath)

    return {
      filename,
    }
  },

  /* --------- find similar images -------- */
  // TODO
  [CmdToVscode.FIND_SIMILAR_IMAGES]: async () => {},

  /* ------------ get image metadata ------------ */
  [CmdToVscode.GET_IMAGE_METADATA]: async (data: { filePath: string }) => {
    const { filePath } = data

    const metadata = await Global.sharp(filePath).metadata()
    let compressed = false

    if (isPng(filePath)) {
      const PNGUint8Array = new Uint8Array(fs.readFileSync(filePath))
      compressed = !!getMetadata(PNGUint8Array, COMPRESSED_META)
    }

    if (!compressed) {
      if (metadata.exif) {
        compressed = !!exif(metadata.exif).Image?.ImageDescription?.includes(COMPRESSED_META)
      }
    }

    return {
      metadata,
      compressed,
    }
  },

  /* --------- get git staged images --------- */
  [CmdToVscode.GET_GIT_STAGED_IMAGES]: async () => {
    async function getStagedImages(root: string) {
      const simpleGit = git({ baseDir: root, binary: 'git' })

      try {
        const files = (await simpleGit.diff(['--staged', '--diff-filter=ACMR', '--name-only'])).split('\n')
        // Filter out non-image files
        let imageFiles = files.filter((file) => Config.file_scan.includes(path.extname(file).slice(1)))
        // Add the full path to the file
        const gitRoot = await simpleGit.revparse(['--show-toplevel'])
        imageFiles = imageFiles.map((file) => path.join(gitRoot, file))
        return imageFiles
      } catch (e) {
        Log.debug(`Get git staged images error: ${e}`)
        return []
      }
    }

    const images = await Promise.all(Global.rootpaths.map((root) => getStagedImages(root)))

    return flatten(images)
  },

  [CmdToVscode.UPDATE_USER_CONFIGURATION]: async (data: { key: string; value: any; target?: ConfigurationTarget }) => {
    await debounceUpdateVscodeConfig(data)

    return true
  },
}

export class MessageCenter {
  static _webview: Webview

  static slientMessages: string[] = [CmdToWebview.WEBVIEW_CALLBACK]

  static init(webview: Webview) {
    this._webview = webview
  }

  static postMessage(message: MessageType) {
    // Filter some message
    if (!this.slientMessages.includes(message.cmd)) {
      Log.debug(`Post message to webview: ${message.cmd}`)
    }
    this._webview.postMessage(message)
  }

  static async handleMessages(message: MessageType) {
    const handler: (data: Record<string, any>, webview: Webview) => Thenable<any> = VscodeMessageCenter[message.cmd]

    if (handler) {
      const data = await handler(message.data, this._webview)
      this.postMessage({ cmd: CmdToWebview.WEBVIEW_CALLBACK, callbackId: message.callbackId, data })
    } else {
      Log.error(`Handler function "${message.cmd}" doesn't exist!`)
    }
  }
}
