import { Context } from '@rootSrc/Context'
import { initCompressor } from '@rootSrc/compress'
import { normalizePath } from '@rootSrc/utils'
import { Log } from '@rootSrc/utils/Log'
import { imageGlob } from '@rootSrc/utils/glob'
import { type ImageType } from '@rootSrc/webview/ImageManager'
import fg from 'fast-glob'
import imageSize from 'image-size'
import micromatch from 'micromatch'
import mime from 'mime/lite'
import fs from 'node:fs'
import path from 'node:path'
import { Uri, type Webview, commands } from 'vscode'
import { CmdToVscode } from './constant'

export type MessageType<T = any> = {
  msgId: string
  cmd: string
  postTime: string
  callbackId: string
  data: T
}

export type MessageParams<T = any> = { message: MessageType<T>; webview: Webview }

export type KeyofMessage = keyof typeof VscodeMessageCenter

export type ReturnOfMessageCenter<K extends KeyofMessage> = RmPromise<ReturnType<(typeof VscodeMessageCenter)[K]>>

export const VscodeMessageCenter = {
  /* -------------- reload webview -------------- */
  [CmdToVscode.RELOAD_WEBVIEW]: async () => {
    const data = await commands.executeCommand('workbench.action.webview.reloadWebviewAction')
    return data
  },

  /* -------------- get all images -------------- */
  [CmdToVscode.GET_ALL_IMAGES]: async ({ webview }: MessageParams) => {
    const absWorkspaceFolders = Context.instance.config.root
    const workspaceFolders = absWorkspaceFolders.map((ws) => path.basename(ws))

    async function _searchImgs(
      absWorkspaceFolder: string,
      webview: Webview,
      fileTypes: Set<string>,
      dirs: Set<string>,
    ) {
      const { config } = Context.instance

      absWorkspaceFolder = normalizePath(absWorkspaceFolder)

      const { all } = imageGlob({
        cwd: absWorkspaceFolder,
        imageType: config.imageType,
        exclude: config.exclude,
        root: config.root,
      })

      const imgs = await fg(all, {
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
        fileTypes.add(fileType)

        const dirPath = normalizePath(path.relative(absWorkspaceFolder, path.dirname(img.path)))

        dirs.add(dirPath)

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
      console.log(err)
    }
    return dimensions
  },

  /* ----------- get extension config ----------- */
  [CmdToVscode.GET_EXT_CONFIG]: async () => {
    return Context.instance.config
  },

  /* ----------- get compressor ---------- */
  [CmdToVscode.GET_COMPRESSOR]: async () => {
    let compressor = Context.instance.compressor
    if (!compressor) {
      try {
        compressor = await initCompressor(Context.instance)
      } catch (e) {
        Log.info(`GET_COMPRESSOR ERROR: ${e as string}`)
        return null
      }
    }
    Log.info(`Use [${compressor.name}] as Compressor`)
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
  }: MessageParams<{ filePaths: string[] }>): Promise<
    | {
        filePath: string
        originSize?: number | undefined
        compressedSize?: number | undefined
        error?: any
      }[]
    | undefined
  > => {
    try {
      let { filePaths } = message.data

      const { compressor } = Context.instance
      filePaths = filePaths.filter((file) => {
        return compressor?.config.exts.includes(path.extname(file))
      })

      const res = await compressor?.compress(filePaths)
      Log.info(`Compress result: ${JSON.stringify(res)}`)
      return res
    } catch (e: any) {
      Log.error(`Compress error: ${e}`)
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

  /* ----------- test vscode command ----------- */
  [CmdToVscode.TEMP_TEST_CMD]: async ({ message }: MessageParams<{ cmd: string; path: string }>) => {
    const { cmd, path } = message.data

    const uri = Uri.file(path)
    await commands.executeCommand(cmd, uri)
  },
}
