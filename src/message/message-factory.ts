import { flatten, pick } from 'es-toolkit'
import { toString } from 'es-toolkit/compat'
import fs from 'fs-extra'
import { convertPathToPattern, globby, type GlobEntry } from 'globby'
import micromatch from 'micromatch'
import mime from 'mime/lite'
import { nanoid } from 'nanoid'
import os from 'node:os'
import path from 'node:path'
import pMap from 'p-map'
import { commands, type ConfigurationTarget, Uri, ViewColumn, window, workspace } from 'vscode'
import { type SharpNS } from '~/@types/global'
import { Commands } from '~/commands'
import { Similarity } from '~/core/analysis/similarity'
import { commandCache } from '~/core/commander'
import { type ConfigType } from '~/core/config/common'
import { Config } from '~/core/config/config'
import { Global } from '~/core/global'
import { SvgCompressor } from '~/core/operator/compressor/svg'
import { type CompressionOptions } from '~/core/operator/compressor/type'
import { UsualCompressor } from '~/core/operator/compressor/usual'
import { FormatConverter, type FormatConverterOptions } from '~/core/operator/format-converter'
import { type OperatorResult } from '~/core/operator/operator'
import { Svgo } from '~/core/operator/svgo'
import { type WorkspaceStateKey } from '~/core/persist/workspace/common'
import { WorkspaceState } from '~/core/persist/workspace/workspace-state'
import { SharpOperator } from '~/core/sharp/sharp-operator'
import { i18n } from '~/i18n'
import { generateOutputPath, normalizePath, resolveDirPath } from '~/utils'
import { cancelablePromise } from '~/utils/abort-promise'
import { Channel } from '~/utils/channel'
import { imageGlob } from '~/utils/glob'
import { convertImageToBase64, convertToBase64IfBrowserNotSupport, isBase64 } from '~/utils/image-type'
import logger from '~/utils/logger'
import { UpdateEvent, UpdateOrigin, UpdateType } from '~/webview/image-manager/utils/tree/const'
import { type ImageManagerPanel } from '~/webview/panel'
import { CmdToVscode, CmdToWebview } from './cmd'
import { getImageExtraInfo, getImageMetadata, getStagedImages } from './message-factory.fn'

type MessageFactoryType = typeof VscodeMessageFactory
type MessageMethodType<K extends KeyofMessage> = MessageFactoryType[K]

export type KeyofMessage = keyof MessageFactoryType
export type MessageType<D extends Record<string, any> | undefined = Record<string, any>, C extends string = any> = {
  cmd: C
  data: D
  msgId?: string
  postTime?: string
  callbackId?: string
}

export type ReturnOfMessage<K extends KeyofMessage> = Awaited<ReturnType<MessageMethodType<K>>>

export type ParameterOfMessage<K extends KeyofMessage> =
  FirstParameter<MessageMethodType<K>> extends Record<string, any> ? FirstParameter<MessageMethodType<K>> : never

/**
 * @name MessageFactory
 * @description It handles the message from webview and return result to webview
 */
export const VscodeMessageFactory = {
  [CmdToVscode.on_webview_ready]: async (_, imageManagerPanel: ImageManagerPanel) => {
    Channel.info(i18n.t('core.webview_ready'))
    const [config, workspaceState] = await Promise.all([
      VscodeMessageFactory[CmdToVscode.get_extension_config](),
      VscodeMessageFactory[CmdToVscode.get_workspace_state](),
    ])
    const {
      initialData: { imageReveal, sharpInstalled },
    } = imageManagerPanel

    return {
      config,
      workspaceState,
      windowState: {
        __reveal_image_path__: imageReveal,
        __sharp_installed__: sharpInstalled,
      },
    }
  },
  /* -------------- reload webview -------------- */
  [CmdToVscode.reload_webview]: async () => {
    const data = await commands.executeCommand('workbench.action.webview.reloadWebviewAction')
    return data
  },
  /* -------------- 获取图片信息 -------------- */
  [CmdToVscode.get_image_info]: async (
    options: {
      glob: string | string[]
      cwd: string
    },
    imageManagerPanel: ImageManagerPanel,
  ) => {
    const { glob, cwd } = options

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

    Channel.debug(`Glob: ${glob}`)

    Channel.debug(`Globby cost: ${performance.now() - start}ms`)

    if (!images.length) {
      logger.debug(`No images found in ${glob}`)
      return []
    }

    const { gitStaged, metadataResults } = await getImageExtraInfo(images, imageManagerPanel)
    // 项目绝对路径
    const projectPath = normalizePath(path.dirname(cwd))
    // 工作区绝对路径
    const absWorkspaceFolder = normalizePath(cwd)
    // 工作区名称
    const workspaceFolder = normalizePath(path.basename(cwd))

    const res = await pMap(images, async (image, index) => {
      image.path = normalizePath(image.path)
      let vscodePath = imageManagerPanel.panel.webview.asWebviewUri(Uri.file(image.path)).toString()

      // Browser doesn't support some exts, convert to png base64
      try {
        vscodePath = (await convertToBase64IfBrowserNotSupport(image.path, Global.sharp)) || vscodePath
      } catch (e) {
        Channel.error(`${i18n.t('core.covert_base64_error')}: ${e}`)
      }

      const dirPath = resolveDirPath(image.path, cwd)
      const absDirPath = normalizePath(path.dirname(image.path))
      const relativePath =
        imageManagerPanel.initialData.rootpaths.length > 1
          ? normalizePath(path.relative(projectPath, image.path)) // 多工作区，相对于项目
          : normalizePath(path.relative(absWorkspaceFolder, image.path)) // 单工作区，相对于工作区

      const metadata = metadataResults[index]

      // 非base64 添加mtimeMs时间戳，避免webview缓存问题
      const vscodePathWithQuery = `${vscodePath}?t=${image.stats?.mtimeMs}`

      const parsedPath = path.parse(image.path)

      // 为了减少内存占用，尽量存储少量数据
      const imageInfo: ImageType = {
        basename: path.basename(image.path),
        name: parsedPath.name,
        path: image.path,
        extname: parsedPath.ext.replace('.', ''),
        stats: pick(image.stats!, ['mtimeMs', 'size']),
        dirPath,
        absDirPath,
        workspaceFolder,
        // base64 不能添加时间戳，会导致图片无法显示
        vscodePath: isBase64(vscodePath) ? vscodePath : vscodePathWithQuery,
        // 为避免base64相同的vscodePath在react渲染中作为key重复出现，使用路径作为key
        key: isBase64(vscodePath) ? image.path : vscodePathWithQuery,
        absWorkspaceFolder,
        relativePath: normalizePath(`./${relativePath}`),
        info: {
          ...metadata,
          gitStaged: gitStaged.includes(image.path),
        },
      }

      return imageInfo
    })

    return res
  },

  /* -------------- 获取cwds下的所有图片 -------------- */
  [CmdToVscode.get_all_images_from_cwds]: async (
    data: {
      glob?: string
    } = {},
    imageManagerPanel: ImageManagerPanel,
  ) => {
    const workspaces = imageManagerPanel.initialData.rootpaths || []

    const { glob } = data

    const start = performance.now()
    try {
      await cancelablePromise.run(
        () => {
          return Promise.all(
            workspaces.map(async (absWorkspaceFolder) => {
              absWorkspaceFolder = normalizePath(absWorkspaceFolder)
              const workspaceFolder = path.basename(absWorkspaceFolder)

              const { allImagePatterns } = imageGlob({
                cwds: [glob || absWorkspaceFolder],
                scan: Config.file_scan,
                exclude: Config.file_exclude,
              })

              const images = await VscodeMessageFactory[CmdToVscode.get_image_info](
                {
                  glob: allImagePatterns,
                  cwd: absWorkspaceFolder,
                },
                imageManagerPanel,
              )

              // 通知webview更新图片
              imageManagerPanel.messageCenter.postMessage({
                cmd: CmdToWebview.update_images,
                data: {
                  updateType: glob ? UpdateType.patch : UpdateType.full,
                  payloads: images.map((image) => ({
                    data: {
                      payload: image,
                      type: UpdateEvent.create,
                    },
                    origin: UpdateOrigin.image,
                  })),
                  workspaceFolder,
                  absWorkspaceFolder,
                  id: nanoid(),
                },
              })
            }),
          )
        },
        {
          key: imageManagerPanel.id + (glob ? glob : '-'),
        },
      )

      Channel.debug(`Get all images cost: ${performance.now() - start}ms`)
      return true
    } catch (e) {
      logger.error(e)
      return false
    }
  },

  /* --------------- 获取指定图片 -------------- */
  [CmdToVscode.get_images]: async (
    data: {
      filePaths: string[]
      cwd: string
    },
    imageManagerPanel: ImageManagerPanel,
  ) => {
    const { filePaths, cwd } = data

    const images = await VscodeMessageFactory[CmdToVscode.get_image_info](
      {
        glob: filePaths.map((t) => convertPathToPattern(t)),
        cwd,
      },
      imageManagerPanel,
    )

    return images
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
  [CmdToVscode.get_compressor]: async (_, imageManagerPanel: ImageManagerPanel) => {
    let compressor = new UsualCompressor(Config.compression, imageManagerPanel)
    const { option, limit } = compressor
    // @ts-expect-error
    compressor = null
    return {
      option,
      limit,
    }
  },

  /* ----------- get format converter ----------- */
  [CmdToVscode.get_format_converter]: async (_, imageManagerPanel: ImageManagerPanel) => {
    let converter = new FormatConverter(Config.conversion, imageManagerPanel)
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
      return await convertImageToBase64(filePath, Global.sharp)
    } catch (e) {
      Channel.error(`${i18n.t('core.copy_base64_error')}: ${toString(e)}`)
      return ''
    }
  },

  /* -------------- compress image -------------- */
  [CmdToVscode.compress_image]: async (
    data: {
      images: ImageType[]
      option: CompressionOptions
    },
    imageManagerPanel: ImageManagerPanel,
  ): Promise<OperatorResult[] | undefined> => {
    try {
      const { images, option } = data

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
            let compressor = new UsualCompressor(option, imageManagerPanel)
            try {
              return compressor.run(image, option)
            } finally {
              // @ts-expect-error
              compressor = null
            }
          }),
          ...svgs.map((image) => () => {
            let compressor = new SvgCompressor(option, imageManagerPanel)
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

      return res
    } catch (e: any) {
      Channel.debug(`${i18n.t('core.compress_error')}: ${JSON.stringify(e)}`)
      return e
    }
  },

  /* ----------- convert image format ----------- */
  [CmdToVscode.convert_image_format]: async (
    data: {
      images: ImageType[]
      option: FormatConverterOptions
    },
    imageManagerPanel: ImageManagerPanel,
  ): Promise<OperatorResult[] | undefined> => {
    try {
      const { images, option } = data
      const res = await pMap(
        images.map((image) => () => {
          let converter = new FormatConverter(Config.conversion, imageManagerPanel)
          try {
            return converter.run(image, option)
          } finally {
            // @ts-expect-error
            converter = null
          }
        }),
        (task) => task(),
      )

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

  /* ---------------- 获取操作缓存 ---------------- */
  [CmdToVscode.get_operation_cmd_cache]: (data: { ids: string[] }) => {
    const { ids } = data
    return ids.map((id) => commandCache.get(id))
  },

  /* --------- 把缓存中的inputBuffer转为base64 --------- */
  [CmdToVscode.get_cmd_cache_inputBuffer_as_base64]: (data: { id: string }) => {
    const cache = VscodeMessageFactory[CmdToVscode.get_operation_cmd_cache]({ ids: [data.id] })[0]
    const { details } = cache || {}
    if (details?.inputBuffer) {
      return convertToBase64IfBrowserNotSupport(details.inputPath, Global.sharp, details.inputBuffer)
    }
    return null
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

    let outputPath = image.path.replace(new RegExp(`\\.${image.extname}$`), `.${outputFileType}`)

    outputPath = generateOutputPath(outputPath, '.crop')

    if (outputFileType !== image.extname) {
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
                sharp?.toFormat(ext as keyof SharpNS.FormatEnum)
              },
              'on:generate-output-path': () => {
                return outputPath
              },
            },
          },
        ],
      })
      try {
        await formatter.run({ filePath: image.path, ext: outputFileType || image.extname, input: imageBuffer })
      } catch (e) {
        Channel.error(`${i18n.t('core.save_cropper_image_error')} ${e}`)
        return null
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

    const results = await pMap(
      images.map((image) => () => getImageMetadata(image)),
      (task) => task(),
      {
        concurrency: os.cpus().length,
      },
    )

    Channel.debug(`Get images metadata cost: ${performance.now() - start}ms`)
    return results
  },

  /* --------- get git staged images --------- */
  [CmdToVscode.get_git_staged_images]: async (_, imageManagerPanel: ImageManagerPanel) => {
    const start = performance.now()

    const images = await Promise.all(imageManagerPanel.initialData.rootpaths.map((root) => getStagedImages(root)))

    Channel.debug(`Get git staged images cost: ${performance.now() - start}ms`)

    return flatten(images)
  },

  /* --------- update user configuration -------- */
  [CmdToVscode.update_user_configuration]: async (
    data: {
      key: Flatten<ConfigType>
      value: any
      target?: ConfigurationTarget
    },
    imageManagerPanel: ImageManagerPanel,
  ) => {
    const { key, value, target } = data

    await cancelablePromise.run(
      async () => {
        imageManagerPanel.isProgrammaticChangeConfig = true
        try {
          await Config.updateConfig(key, value, target)
        } finally {
          imageManagerPanel.isProgrammaticChangeConfig = false
        }
      },
      {
        key: key + imageManagerPanel.id,
      },
    )

    return true
  },

  /* ------------ get workspace state ----------- */
  [CmdToVscode.get_workspace_state]: async () => {
    return WorkspaceState.get_all()
  },

  /* ---------- update workspace state ---------- */
  [CmdToVscode.update_workspace_state]: async <T extends WorkspaceStateKey, U>(
    data: {
      key: T
      value: U | undefined
    },
    imageMangerPanel: ImageManagerPanel,
  ) => {
    const { key, value } = data
    await cancelablePromise.run(() => WorkspaceState.update(key, value), { key: key + imageMangerPanel.id })
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
  /* --------------- 获取路径下的同级文件(夹)列表 --------------- */
  [CmdToVscode.get_sibling_resource]: async (data: { source: string[] }) => {
    const { source } = data
    const res = await Promise.all(source.map((p) => fs.readdir(path.dirname(p))))
    return res.flat()
  },
  /* ---------------- 打开svgo配置文件 ---------------- */
  [CmdToVscode.open_svgo_config]: async () => {
    await commands.executeCommand(Commands.configure_svgo)
    return true
  },
  /* ---------------- 重命名文件/目录 --------------- */
  [CmdToVscode.rename_file]: async (data: { files: { source: string; target: string }[]; overwrite?: boolean }) => {
    const { files, overwrite = false } = data
    const res = await Promise.allSettled(
      files.map(({ source, target }) =>
        workspace.fs.rename(Uri.file(source), Uri.file(target), {
          overwrite,
        }),
      ),
    )
    return res.map((item, i) => ({
      ...item,
      ...files[i],
    }))
  },
  /* ---------------- 复制/移动图片文件到指定目录 --------------- */
  [CmdToVscode.copy_or_move_file_to]: async (data: {
    source: string[]
    target: string
    type: 'copy' | 'move'
    overwrite?: boolean
  }) => {
    const { source, target, type, overwrite = false } = data

    const fnMap = {
      copy: workspace.fs.copy,
      move: workspace.fs.rename,
    }

    const res = await Promise.allSettled(
      source.map((filePath) => {
        const targetPath = path.join(target, path.basename(filePath))
        return fnMap[type](Uri.file(filePath), Uri.file(targetPath), {
          overwrite,
        })
      }),
    )

    return res.map((item, i) => ({
      ...item,
      source: source[i],
      target: path.join(target, path.basename(source[i])),
    }))
  },
}
