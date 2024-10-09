import fs from 'fs-extra'
import { convertPathToPattern, globby, type GlobEntry } from 'globby'
import { flatten, toString } from 'lodash-es'
import micromatch from 'micromatch'
import mime from 'mime/lite'
import path from 'node:path'
import pMap from 'p-map'
import { commands, type ConfigurationTarget, Uri, ViewColumn, type Webview, window, workspace } from 'vscode'
import { type SharpNS } from '~/@types/global'
import { Commands } from '~/commands'
import {
  Config,
  FormatConverter,
  type FormatConverterOptions,
  Global,
  type OperatorResult,
  SharpOperator,
  Svgo,
} from '~/core'
import { Similarity } from '~/core/analysis'
import { commandCache } from '~/core/commander'
import { type ConfigType } from '~/core/config/common'
import { SvgCompressor } from '~/core/operator/compressor/svg'
import { type CompressionOptions } from '~/core/operator/compressor/type'
import { UsualCompressor } from '~/core/operator/compressor/usual'
import { WorkspaceState } from '~/core/persist'
import { type WorkspaceStateKey } from '~/core/persist/workspace/common'
import { i18n } from '~/i18n'
import { generateOutputPath, normalizePath, resolveDirPath } from '~/utils'
import { controlledAbortPromise } from '~/utils/abort-promise'
import { Channel } from '~/utils/channel'
import { convertImageToBase64, convertToBase64IfBrowserNotSupport, isBase64 } from '~/utils/image-type'
import logger from '~/utils/logger'
import { ImageManagerPanel } from '~/webview/panel'
import { CmdToVscode, CmdToWebview } from './cmd'
import { getImageExtraInfo, getImageMetadata, getStagedImages, searchImages } from './message-center.fn'
import { WebviewMessageCenter } from './webview-message-center'

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

type FirstParameter<F> = F extends (arg: infer A, ...args: any) => any ? A : never

export type FirstParameterOfMessageCenter<K extends KeyofMessage> =
  FirstParameter<MessageMethodType<K>> extends Record<string, any> ? FirstParameter<MessageMethodType<K>> : never

/**
 * @name MessageCenter
 * @description It handles the message from webview and return result to webview
 */
export const VscodeMessageCenter = {
  [CmdToVscode.on_webview_ready]: async () => {
    Channel.info(i18n.t('core.webview_ready'))
    const config = await VscodeMessageCenter[CmdToVscode.get_extension_config]()
    const workspaceState = await VscodeMessageCenter[CmdToVscode.get_workspace_state]()
    const { imageReveal } = ImageManagerPanel

    return {
      config,
      workspaceState,
      windowState: {
        __reveal_image_path__: imageReveal,
      },
    }
  },
  /* -------------- reload webview -------------- */
  [CmdToVscode.reload_webview]: async () => {
    const data = await commands.executeCommand('workbench.action.webview.reloadWebviewAction')
    return data
  },
  /* -------------- get image info -------------- */
  [CmdToVscode.get_image]: async (
    options: {
      glob: string | string[]
      cwd: string
      onResolve?: (image: ImageType) => void
    },
    webview: Webview,
  ) => {
    const { glob, cwd, onResolve } = options

    const start = performance.now()

    const images = await globby(glob, {
      cwd,
      objectMode: true,
      dot: false,
      absolute: true,
      onlyFiles: true,
      stats: true,
      gitignore: Config.file_gitignore,
    })

    Channel.debug(`Globby cost: ${performance.now() - start}ms`)

    if (!images.length) {
      logger.debug(`No images found in ${glob}`)
      return []
    }

    const { gitStaged, metadataResults } = await getImageExtraInfo(images)

    // 项目绝对路径
    const basePath = normalizePath(path.dirname(cwd))
    // 工作区绝对路径
    const absWorkspaceFolder = normalizePath(cwd)
    // 工作区名称
    const workspaceFolder = normalizePath(path.basename(cwd))

    return Promise.all<ImageType>(
      images.map(async (image, index) => {
        image.path = normalizePath(image.path)
        let vscodePath = webview.asWebviewUri(Uri.file(image.path)).toString()

        // Browser doesn't support [tiff, tif], convert to png base64
        try {
          vscodePath = (await convertToBase64IfBrowserNotSupport(image.path)) || vscodePath
        } catch (e) {
          Channel.error(`${i18n.t('core.covert_base64_error')}: ${e}`)
        }

        const fileType = path.extname(image.path).replace('.', '')
        const dirPath = resolveDirPath(image.path, cwd)
        const absDirPath = normalizePath(path.dirname(image.path))
        const relativePath =
          Global.rootpaths.length > 1
            ? normalizePath(path.relative(basePath, image.path)) // 多工作区，相对于项目
            : normalizePath(path.relative(absWorkspaceFolder, image.path)) // 单工作区，相对于工作区

        const metadata = metadataResults[index]

        // 如果非base64添加mtimeMs时间戳，避免webview缓存问题
        const vscodePathWithQuery = isBase64(vscodePath) ? vscodePath : `${vscodePath}?t=${image.stats?.mtimeMs}`

        const imageInfo: ImageType = {
          name: path.basename(image.path),
          path: image.path,
          stats: image.stats!,
          basePath,
          dirPath,
          absDirPath,
          workspaceFolder,
          fileType,
          vscodePath: vscodePathWithQuery,
          absWorkspaceFolder,
          relativePath: normalizePath(`./${relativePath}`),
          extraPathInfo: path.parse(image.path),
          info: {
            ...metadata,
            gitStaged: gitStaged.includes(image.path),
          },
        }

        onResolve?.(imageInfo)

        return imageInfo
      }),
    )
  },

  /* -------------- get all images -------------- */
  [CmdToVscode.get_all_images]: async (_data: unknown, webview: Webview) => {
    const absWorkspaceFolders = Global.rootpaths
    const workspaceFolders = absWorkspaceFolders.map((ws) => path.basename(ws))

    const start = performance.now()
    try {
      const res = await controlledAbortPromise(
        async () => {
          const data = await Promise.all(
            absWorkspaceFolders.map(async (workspaceFolder) => {
              const fileTypes: Set<string> = new Set()
              const dirs: Set<string> = new Set()

              const images = await searchImages(workspaceFolder, webview, fileTypes, dirs)

              Channel.debug(`Get images cost: ${performance.now() - start}ms in ${workspaceFolder}`)

              return {
                images,
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
        },
        {
          key: CmdToVscode.get_all_images,
        },
      )
      Channel.debug(`Get all images cost: ${performance.now() - start}ms`)
      return res
    } catch {
      return {
        data: [],
        absWorkspaceFolders,
        workspaceFolders,
      }
    }
  },

  /* --------------- get one image -------------- */
  [CmdToVscode.get_one_image]: async (
    data: {
      filePath: string
      cwd: string
    },
    webview: Webview,
  ) => {
    const { filePath, cwd } = data

    const images = await VscodeMessageCenter[CmdToVscode.get_image](
      {
        glob: convertPathToPattern(filePath),
        cwd,
      },
      webview,
    )

    return images[0]
  },

  /* ------- get extension & vscode config ------ */
  [CmdToVscode.get_extension_config]: async () => {
    const config = Config.all

    const vscodeConfig = {
      theme: Global.vscodeTheme,
      language: Global.vscodeLanguage,
      reduceMotion: Global.vscodeReduceMotion,
    }

    return {
      ext: config,
      vscode: vscodeConfig,
    }
  },

  /* ----------- get compressor ---------- */
  [CmdToVscode.get_compressor]: async () => {
    let compressor = new UsualCompressor(Config.compression)
    const { option, limit } = compressor
    // @ts-expect-error
    compressor = null
    return {
      option,
      limit,
    }
  },

  /* ----------- get format converter ----------- */
  [CmdToVscode.get_format_converter]: async () => {
    let converter = new FormatConverter(Config.conversion)
    const { option, limit } = converter
    // @ts-expect-error
    converter = null
    return {
      option,
      limit,
    }
  },

  /* ------- open path in vscode explorer ------ */
  [CmdToVscode.open_image_in_vscode_explorer]: (data: { filePath: string }) => {
    const res = commands.executeCommand('revealInExplorer', Uri.file(data.filePath))
    return res
  },

  /* --------- open path in os explorer -------- */
  [CmdToVscode.open_image_in_os_explorer]: async (data: { filePath: string }) => {
    const { filePath } = data
    let revealPath = filePath
    if (Config.file_revealFileInOsDeeply) {
      try {
        const files = fs.readdirSync(revealPath)
        revealPath = path.join(revealPath, files[0])
      } catch {}
    }

    const res = await commands.executeCommand('revealFileInOS', Uri.file(revealPath))
    return res
  },

  /* ------------ copy image as base64 --------- */
  [CmdToVscode.copy_image_as_base64]: async (data: { filePath: string }) => {
    const { filePath } = data

    try {
      return await convertImageToBase64(filePath)
    } catch (e) {
      Channel.error(`${i18n.t('core.copy_base64_error')}: ${toString(e)}`)
      return ''
    }
  },

  /* -------------- compress image -------------- */
  [CmdToVscode.compress_image]: async (data: {
    images: ImageType[]
    option: CompressionOptions
  }): Promise<OperatorResult[] | undefined> => {
    try {
      const { images, option } = data

      logger.debug(`Compress params: `, data)

      const svgs: ImageType[] = []
      const usuals: ImageType[] = []

      images.forEach((item) => {
        const filePath = item.path
        if (path.extname(filePath) === '.svg') {
          svgs.push(item)
        } else {
          usuals.push(item)
        }
      })

      const res = await pMap(
        [
          ...usuals.map((image) => () => {
            let compressor = new UsualCompressor(option)
            try {
              return compressor.run(image, option)
            } finally {
              // @ts-expect-error
              compressor = null
            }
          }),
          ...svgs.map((image) => () => {
            let compressor = new SvgCompressor(option)
            try {
              return compressor.run(image, option)
            } finally {
              // @ts-expect-error
              compressor = null
            }
          }),
        ],
        (task) => task(),
      )
      logger.debug(`Compress result: `, res)
      return res
    } catch (e: any) {
      Channel.debug(`${i18n.t('core.compress_error')}: ${JSON.stringify(e)}`)
      return e
    }
  },

  /* ----------- convert image format ----------- */
  [CmdToVscode.convert_image_format]: async (data: {
    images: ImageType[]
    option: FormatConverterOptions
  }): Promise<OperatorResult[] | undefined> => {
    try {
      const { images, option } = data
      logger.debug(`Convert params:`, data)
      const res = await pMap(
        images.map((image) => () => {
          let converter = new FormatConverter(Config.conversion)
          try {
            return converter.run(image, option)
          } finally {
            // @ts-expect-error
            converter = null
          }
        }),
        (task) => task(),
      )
      logger.debug(`Convert result:`, res)
      return res
    } catch (e: any) {
      logger.debug(`Convert error:`, e)
      return e
    }
  },

  /* -------------- undo operation -------------- */
  [CmdToVscode.undo_operation]: async (data: {
    /**
     * 操作id
     */
    id: string
  }) => {
    const { id } = data
    try {
      await commandCache.executeUndo(id)
      return true
    } catch (e: any) {
      return {
        error: e instanceof Error ? e.message : toString(e),
      }
    }
  },

  /* ------ delete operation command cache ------ */
  [CmdToVscode.remove_operation_cmd_cache]: async (data: { ids: string[] }) => {
    for (const id of data.ids) {
      commandCache.remove(id)
    }
  },

  /* ------- clear operation command cache ------ */
  [CmdToVscode.clear_operation_cmd_cache]: async () => {
    commandCache.clear()
  },

  /* -------- match glob with micromatch -------- */
  [CmdToVscode.micromatch_ismatch]: (data: { filePaths: string[]; globs: string[]; not?: boolean }) => {
    const { filePaths, globs, not } = data
    if (not) {
      return micromatch.not(filePaths, globs)
    }
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
        await fs.writeFile(outputPath, imageBuffer)
      } catch (e) {
        Channel.error(`${i18n.t('core.save_cropper_image_error')} ${e}`)
        return null
      }
    }

    const filename = path.basename(outputPath)

    return {
      filename,
    }
  },

  /* --------- find similar images -------- */
  [CmdToVscode.find_similar_images]: async (data: { image: ImageType; scope: ImageType[] }) => {
    const { image, scope } = data
    try {
      return await Similarity.findSimilar(image, scope)
    } catch (e) {
      return e instanceof Error ? e : toString(e)
    }
  },

  /* ------------ get images metadata ------------ */
  [CmdToVscode.get_images_metadata]: async (data: { images: GlobEntry[] }) => {
    const start = performance.now()

    const { images } = data

    const metadataPromises = images.map((image) => {
      return getImageMetadata(image)
    })

    const results = await Promise.all(metadataPromises)

    Channel.debug(`Get images metadata cost: ${performance.now() - start}ms`)
    return results
  },

  /* --------- get git staged images --------- */
  [CmdToVscode.get_git_staged_images]: async () => {
    const start = performance.now()

    const images = await Promise.all(Global.rootpaths.map((root) => getStagedImages(root)))

    Channel.debug(`Get git staged images cost: ${performance.now() - start}ms`)

    return flatten(images)
  },

  /* --------- update user configuration -------- */
  [CmdToVscode.update_user_configuration]: async (data: {
    key: Flatten<ConfigType>
    value: any
    target?: ConfigurationTarget
  }) => {
    const { key, value, target } = data

    await controlledAbortPromise(
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
    await controlledAbortPromise(() => WorkspaceState.update(key, value), { key })
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

  /* ---------------- pretty svg ---------------- */
  [CmdToVscode.prettify_svg]: async (data: { filePath: string }) => {
    const { filePath } = data
    const svgString = await fs.readFile(filePath, 'utf-8')
    const svg = await Svgo.prettify(svgString, Config.compression.svg)
    await fs.writeFile(filePath, svg)
    return true
  },
  /* --------- open file in text editor --------- */
  [CmdToVscode.open_file_in_text_editor]: async (data: { filePath: string }) => {
    const { filePath } = data
    const document = await workspace.openTextDocument(Uri.file(filePath))
    await window.showTextDocument(document, ViewColumn.Active)
    return true
  },
  /* ---------------- delete file/dir --------------- */
  [CmdToVscode.delete_file]: async (data: { filePaths: string[]; recursive?: boolean; useTrash?: boolean }) => {
    const { filePaths, recursive, useTrash = true } = data
    try {
      await Promise.all(filePaths.map((filePath) => workspace.fs.delete(Uri.file(filePath), { useTrash, recursive })))
      return true
    } catch {
      return false
    }
  },
  /* ---------------- rename file/dir --------------- */
  [CmdToVscode.rename_file]: async (data: { source: string; target: string }) => {
    try {
      const { source, target } = data
      await workspace.fs.rename(Uri.file(source), Uri.file(target), {
        overwrite: false,
      })

      return true
    } catch (e) {
      if (e instanceof Error && e.message.includes('already exists')) {
        return {
          error_msg: e.message,
        }
      }
      return false
    }
  },
  /* ----------- copy file to clipbard ---------- */
  [CmdToVscode.copy_file_to_clipboard]: async () => {
    // TODO: implement copy file to clipboard
  },
  /* ---------- reveal image in viewer ---------- */
  [CmdToVscode.reveal_image_in_viewer]: (data: { filePath: string }) => {
    WebviewMessageCenter[CmdToWebview.reveal_image_in_viewer](data.filePath)
    return true
  },
  /* --------------- 获取路径下的同级文件(夹)列表 --------------- */
  [CmdToVscode.get_sibling_resource]: async (data: { source: string }) => {
    const { source } = data
    const siblings = await fs.readdir(path.dirname(source))
    return siblings
  },
  /* ---------------- 打开svgo配置文件 ---------------- */
  [CmdToVscode.open_svgo_config]: async () => {
    await commands.executeCommand(Commands.configure_svgo)
    return true
  },
}
