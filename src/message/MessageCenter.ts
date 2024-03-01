import { flatten } from '@minko-fe/lodash-pro'
import exif from 'exif-reader'
import fg from 'fast-glob'
import fs from 'fs-extra'
import imageSize from 'image-size'
import { getMetadata } from 'meta-png'
import micromatch from 'micromatch'
import mime from 'mime/lite'
import path from 'node:path'
import git from 'simple-git'
import { ConfigurationTarget, Uri, type Webview, commands, env, workspace } from 'vscode'
import { Config, Global } from '~/core'
import { type CompressionOptions } from '~/core/compress'
import { COMPRESSED_META } from '~/core/compress/meta'
import { EXT_NAMESPACE } from '~/meta'
import { isPng, normalizePath } from '~/utils'
import { Log } from '~/utils/Log'
import { imageGlob } from '~/utils/glob'
import { type ImageType } from '~/webview/ImageManager'
import { CmdToVscode, CmdToWebview } from './cmd'

export type MessageType<T = any> = {
  cmd: string
  msgId?: string
  postTime?: string
  callbackId?: string
  data: T
}

export type MessageParams<T = any> = { message: MessageType<T>; webview: Webview }

export type KeyofMessage = keyof typeof VscodeMessageCenter

export type ReturnOfMessageCenter<K extends KeyofMessage> = RmPromise<ReturnType<(typeof VscodeMessageCenter)[K]>>

export const VscodeMessageCenter = {
  [CmdToVscode.ON_WEBVIEW_READY]: async () => {
    Log.info('Webview is ready')
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
  [CmdToVscode.GET_ALL_IMAGES]: async ({ webview }: MessageParams) => {
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

      return imgs.map((img) => {
        img.path = normalizePath(img.path)

        const vscodePath = webview.asWebviewUri(Uri.file(img.path)).toString()

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
      })
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

  /* ----------- get image dimensions ----------- */
  [CmdToVscode.GET_IMAGE_DIMENSIONS]: async ({ message }: MessageParams<{ filePath: string }>) => {
    let dimensions = { width: 0, height: 0 }

    const size = imageSize(message.data.filePath)
    try {
      dimensions = {
        width: size.width || 0,
        height: size.height || 0,
      }
    } catch (err) {
      Log.info(`GET_IMAGE_DIMENSIONS ERROR: ${err}`)
    }
    return dimensions
  },

  /* ----------- get extension config ----------- */
  [CmdToVscode.GET_EXT_CONFIG]: async () => {
    const config = Config.all
    const { theme, language } = config.appearance

    function isSkip<T>(value: T): Exclude<T, 'auto'> | null {
      if (value === 'auto') {
        return null
      }
      return value as Exclude<T, 'auto'>
    }
    return {
      ...config,
      appearance: {
        ...config.appearance,
        theme: isSkip(theme) || Global.theme,
        language: (isSkip(language) || env.language) as Language,
      },
    }
  },

  /* ----------- get compressor ---------- */
  [CmdToVscode.GET_COMPRESSOR]: async () => {
    const compressor = Global.compressor
    return compressor
  },

  /* ------- open path in vscode explorer ------ */
  [CmdToVscode.OPEN_IMAGE_IN_VSCODE_EXPLORER]: ({ message }: MessageParams<{ filePath: string }>) => {
    const res = commands.executeCommand('revealInExplorer', Uri.file(message.data.filePath))
    return res
  },

  /* --------- open path in os explorer -------- */
  [CmdToVscode.OPEN_IMAGE_IN_OS_EXPLORER]: async ({ message }: MessageParams<{ filePath: string; deep?: boolean }>) => {
    const { filePath, deep = true } = message.data
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
  [CmdToVscode.COPY_IMAGE_AS_BASE64]: async ({ message }: MessageParams<{ filePath: string }>) => {
    const { filePath } = message.data

    const bitmap = await fs.promises.readFile(filePath)
    const imgType = filePath.substring(filePath.lastIndexOf('.') + 1)

    const imgBase64 = `data:${mime.getType(imgType)};base64,${Buffer.from(bitmap).toString('base64')}`
    return imgBase64
  },

  /* -------------- compress image -------------- */
  [CmdToVscode.COMPRESS_IMAGE]: async ({
    message,
  }: MessageParams<{
    filePaths: string[]
    option?: CompressionOptions
  }>): Promise<
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
      const { filePaths, option } = message.data
      Log.info(`Compress params: ${JSON.stringify(message.data)}`)
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
  [CmdToVscode.MICROMATCH_ISMATCH]: ({ message }: MessageParams<{ filePaths: string[]; globs: string[] }>) => {
    const { filePaths, globs } = message.data
    return micromatch(filePaths, globs)
  },

  /* --------- save cropper image to file -------- */
  [CmdToVscode.SAVE_CROPPER_IMAGE]: async ({
    message,
  }: MessageParams<{
    dataUrl: string
    image: ImageType
  }>): Promise<{ filename: string; fileType: string | null } | null> => {
    const { dataUrl, image } = message.data

    const [mimeType, base64] = dataUrl.split(',')
    const imageBuffer = Buffer.from(base64, 'base64')
    const outputFileType = mime.getExtension(mimeType.match(/data:(.*);/)?.[1] || '') || image.fileType
    // TODO: custom suffix
    const filename = `${image.extraPathInfo.name}.crop.${outputFileType}`
    try {
      const newPath = path.join(image.absDirPath, filename)
      await fs.promises.writeFile(newPath, imageBuffer)
    } catch (e) {
      Log.error(`SAVE_CROPPER_IMAGE ${e}`)
      return null
    }
    return {
      filename,
      fileType: outputFileType,
    }
  },

  /* --------- find similar images -------- */
  // TODO
  [CmdToVscode.FIND_SIMILAR_IMAGES]: async () => {},

  /* ------------ get image metadata ------------ */
  [CmdToVscode.GET_IMAGE_METADATA]: async ({ message }: MessageParams<{ filePath: string }>) => {
    const { filePath } = message.data

    const metadata = await Global.sharp(filePath).metadata()
    let compressed = false

    if (isPng(filePath)) {
      const arrayBuffer = new Uint8Array(fs.readFileSync(filePath))
      compressed = !!getMetadata(arrayBuffer, COMPRESSED_META)
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
    function getStagedImages(root: string) {
      return new Promise<string[]>((resolve, reject) => {
        git({
          baseDir: root,
        }).diff(['--cached', '--diff-filter=ACMR', '--name-only'], (err, result) => {
          if (err) reject(err)
          // Split the result into an array of file names
          const files = result.split('\n')
          // Filter out non-image files
          let imageFiles = files.filter((file) => Config.file_scan.includes(path.extname(file).slice(1)))
          imageFiles = imageFiles.map((file) => path.join(root, file))
          resolve(imageFiles)
        })
      })
    }

    const images = await Promise.all(Global.rootpaths.map((root) => getStagedImages(root)))

    return flatten(images)
  },

  [CmdToVscode.UPDATE_USER_CONFIGURATION]: async ({
    message,
  }: MessageParams<{ key: string; value: any; target: ConfigurationTarget }>) => {
    const { key, value, target = ConfigurationTarget.Global } = message.data
    await workspace.getConfiguration().update(`${EXT_NAMESPACE}.${key}`, value, target)
    return true
  },

  /* ----------- test vscode command ----------- */
  [CmdToVscode.TEMP_TEST_CMD]: async ({ message }: MessageParams<{ cmd: string; path: string }>) => {
    const { cmd, path } = message.data

    const uri = Uri.file(path)
    await commands.executeCommand(cmd, uri)
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
      Log.info(`Post message to webview: ${message.cmd}`)
    }
    this._webview.postMessage(message)
  }

  static async handleMessages(message: MessageType) {
    const handler: (params: MessageParams) => Thenable<any> = VscodeMessageCenter[message.cmd]

    if (handler) {
      const data = await handler({ message, webview: this._webview })
      this.postMessage({ cmd: CmdToWebview.WEBVIEW_CALLBACK, callbackId: message.callbackId, data })
    } else {
      Log.error(`Handler function "${message.cmd}" doesn't exist!`, true)
    }
  }
}
