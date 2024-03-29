import { flatten, toString } from '@minko-fe/lodash-pro'
import exif from 'exif-reader'
import fg from 'fast-glob'
import fs from 'fs-extra'
import imageSize from 'image-size'
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
import { type ConfigKey } from '~/core/config/common'
import { WorkspaceState } from '~/core/persist'
import { type WorkspaceStateKey } from '~/core/persist/workspace/common'
import { generateOutputPath, isPng, normalizePath } from '~/utils'
import { Channel } from '~/utils/Channel'
import { imageGlob } from '~/utils/glob'
import { type ImageType } from '~/webview/ImageManager'
import { CmdToVscode, CmdToWebview } from './cmd'
import { convertImageToBase64, convertToBase64IfBrowserNotSupport, debouncePromise } from './utils'

export type VscodeMessageCenterType = typeof VscodeMessageCenter

export type KeyofMessage = keyof VscodeMessageCenterType

export type MessageType<D extends Record<string, any> = Record<string, any>, C extends string = any> = {
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

/**
 * @name MessageCenter
 * @description It handles the message from webview and return result to webview
 */
export const VscodeMessageCenter = {
  [CmdToVscode.on_webview_ready]: async () => {
    Channel.debug('Webview is ready')
    const config = await VscodeMessageCenter[CmdToVscode.get_extension_config]()
    const workspaceState = await VscodeMessageCenter[CmdToVscode.get_workspace_state]()

    return {
      config,
      workspaceState,
    }
  },
  /* -------------- reload webview -------------- */
  [CmdToVscode.reload_webview]: async () => {
    const data = await commands.executeCommand('workbench.action.webview.reloadWebviewAction')
    return data
  },

  /* -------------- get all images -------------- */
  [CmdToVscode.get_all_images]: async (_: any, webview: Webview) => {
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
            vscodePath = (await convertToBase64IfBrowserNotSupport(img.path)) || vscodePath
          } catch (e) {
            Channel.error(`Convert to base64 error: ${e}`)
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
  [CmdToVscode.get_extension_config]: async () => {
    const config = Config.all

    const vscodeConfig = {
      theme: Global.vscodeTheme,
      language: Global.vscodeLanguage,
    }

    return {
      ext: config,
      vscode: vscodeConfig,
    }
  },

  /* ----------- get compressor ---------- */
  [CmdToVscode.get_compressor]: async () => {
    const compressor = Global.compressor
    return compressor
  },

  /* ------- open path in vscode explorer ------ */
  [CmdToVscode.open_image_in_vscode_explorer]: (data: { filePath: string }) => {
    const res = commands.executeCommand('revealInExplorer', Uri.file(data.filePath))
    return res
  },

  /* --------- open path in os explorer -------- */
  [CmdToVscode.open_image_in_os_explorer]: async (data: { filePath: string; deep?: boolean }) => {
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
  [CmdToVscode.copy_image_as_base64]: async (data: { filePath: string }) => {
    const { filePath } = data

    try {
      return await convertImageToBase64(filePath)
    } catch (e) {
      Channel.error(`Copy image as base64 error: ${toString(e)}`)
      return ''
    }
  },

  /* -------------- compress image -------------- */
  [CmdToVscode.compress_image]: async (data: {
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
      Channel.info(`Compress params: ${JSON.stringify(data)}`)
      const { compressor } = Global
      const res = await compressor?.compress(filePaths, option)
      Channel.info(`Compress result: ${JSON.stringify(res)}`)
      return res
    } catch (e: any) {
      Channel.info(`Compress error: ${JSON.stringify(e)}`)
      return e
    }
  },

  /* -------- match glob with micromatch -------- */
  [CmdToVscode.micromatch_ismatch]: (data: { filePaths: string[]; globs: string[] }) => {
    const { filePaths, globs } = data
    return micromatch(filePaths, globs)
  },

  /* --------- save cropper image to file -------- */
  [CmdToVscode.save_cropper_image]: async (data: {
    dataUrl: string
    image: ImageType
  }): Promise<{ filename: string } | null> => {
    const { dataUrl, image } = data

    const [mimeType, base64] = dataUrl.split(',')

    const imageBuffer = Buffer.from(base64, 'base64')

    const outputFileType = mime.getExtension(mimeType.match(/data:(.*);/)?.[1] || '')

    const outputPath = generateOutputPath(image.path, '.crop')

    if (outputFileType !== image.fileType) {
      // Convert to the same format as the original image
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
      // Write image output directly
      try {
        await fs.promises.writeFile(outputPath, imageBuffer)
      } catch (e) {
        Channel.error(`save_cropper_image ${e}`)
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
  [CmdToVscode.find_similar_images]: async () => {},

  /* ------------ get image metadata ------------ */
  [CmdToVscode.get_image_metadata]: async (data: { filePath: string }) => {
    const { filePath } = data
    let compressed = false
    let metadata: SharpNS.Metadata = {} as SharpNS.Metadata

    try {
      metadata = await Global.sharp(filePath).metadata()
    } catch {
      metadata = imageSize(filePath) as SharpNS.Metadata
    } finally {
      if (metadata.exif) {
        compressed = !!exif(metadata.exif).Image?.ImageDescription?.includes(COMPRESSED_META)
      }
      if (!compressed && isPng(filePath)) {
        const PNGUint8Array = new Uint8Array(fs.readFileSync(filePath))
        try {
          compressed = !!getMetadata(PNGUint8Array, COMPRESSED_META)
        } catch {}
      }
    }

    return {
      metadata,
      compressed,
    }
  },

  /* --------- get git staged images --------- */
  [CmdToVscode.get_git_staged_images]: async () => {
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
        Channel.debug(`Get git staged images error: ${e}`)
        return []
      }
    }

    const images = await Promise.all(Global.rootpaths.map((root) => getStagedImages(root)))

    return flatten(images)
  },

  /* --------- update user configuration -------- */
  [CmdToVscode.update_user_configuration]: (data: { key: ConfigKey; value: any; target?: ConfigurationTarget }) => {
    const { key, value, target } = data

    debouncePromise(
      async () => {
        Global.isProgrammaticChangeConfig = true
        try {
          await Config.updateConfig(key, value, target)
        } finally {
          Global.isProgrammaticChangeConfig = false
        }
      },
      {
        key,
      },
    )

    return true
  },

  /* ------------ get workspace state ----------- */
  [CmdToVscode.get_workspace_state]: async () => {
    return WorkspaceState.get_all()
  },

  /* ---------- update workspace state ---------- */
  [CmdToVscode.update_workspace_state]: async <T extends WorkspaceStateKey, U>(data: {
    key: T
    value: U | undefined
  }) => {
    const { key, value } = data
    await debouncePromise(
      () => {
        WorkspaceState.update(key, value)
      },
      { key },
    )
    return true
  },

  /* ----------- clear_workspace_state ---------- */
  [CmdToVscode.clear_workspace_state]: async () => {
    await WorkspaceState.clear_unused()
    await WorkspaceState.clear()
    return true
  },

  /* ------- clear useless workspace state ------ */
  [CmdToVscode.clear_useless_workspace_state]: async () => {
    await WorkspaceState.clear_unused()
    return true
  },
}

export class MessageCenter {
  static _webview: Webview

  static slientMessages: string[] = [CmdToWebview.webview_callback]

  static init(webview: Webview) {
    this._webview = webview
  }

  static postMessage<T extends keyof typeof CmdToWebview>(message: MessageType<any, T>) {
    // Filter some message
    if (!this.slientMessages.includes(message.cmd)) {
      Channel.debug(`Post message to webview: ${message.cmd}`)
    }
    this._webview.postMessage(message)
  }

  static async handleMessages(message: MessageType) {
    const handler: (data: Record<string, any>, webview: Webview) => Thenable<any> = VscodeMessageCenter[message.cmd]

    if (handler) {
      const data = await handler(message.data, this._webview)
      this.postMessage({ cmd: CmdToWebview.webview_callback, callbackId: message.callbackId, data })
    } else {
      Channel.error(`Handler function "${message.cmd}" doesn't exist!`)
    }
  }
}
