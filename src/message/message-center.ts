import { flatten, toString } from '@minko-fe/lodash-pro'
import exif from 'exif-reader'
import fg from 'fast-glob'
import fs from 'fs-extra'
import imageSize from 'image-size'
import micromatch from 'micromatch'
import mime from 'mime/lite'
import path from 'node:path'
import git from 'simple-git'
import { optimize } from 'svgo'
import { type ConfigurationTarget, Uri, ViewColumn, type Webview, commands, window, workspace } from 'vscode'
import { type SharpNS } from '~/@types/global'
import {
  type CompressionOptions,
  Config,
  type FormatConverterOptions,
  Global,
  type OperatorResult,
  SharpOperator,
  Svgo,
} from '~/core'
import { Similarity } from '~/core/analysis'
import { type ConfigType } from '~/core/config/common'
import { COMPRESSED_META } from '~/core/operator/meta'
import { WorkspaceState } from '~/core/persist'
import { type WorkspaceStateKey } from '~/core/persist/workspace/common'
import { i18n } from '~/i18n'
import { generateOutputPath, normalizePath } from '~/utils'
import { Channel } from '~/utils/channel'
import { imageGlob } from '~/utils/glob'
import { ImageManagerPanel } from '~/webview/panel'
import { CmdToVscode } from './cmd'
import { convertImageToBase64, convertToBase64IfBrowserNotSupport, debouncePromise, isBase64 } from './utils'

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
    const { watchedTargetImage } = ImageManagerPanel

    return {
      config,
      workspaceState,
      windowState: {
        __target_image_path__: watchedTargetImage.path,
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

    function _resolveDirPath(imagePath: string) {
      if (cwd === path.dirname(imagePath)) return ''
      return normalizePath(path.relative(cwd, path.dirname(imagePath)))
    }

    const images = await fg(glob, {
      cwd,
      objectMode: true,
      dot: false,
      absolute: true,
      markDirectories: true,
      stats: true,
    })

    return Promise.all<ImageType>(
      images.map(async (image) => {
        image.path = normalizePath(image.path)
        let vscodePath = webview.asWebviewUri(Uri.file(image.path)).toString()

        // Browser doesn't support [tiff, tif], convert to png base64
        try {
          vscodePath = (await convertToBase64IfBrowserNotSupport(image.path)) || vscodePath
        } catch (e) {
          Channel.error(`${i18n.t('core.covert_base64_error')}: ${e}`)
        }

        const fileType = path.extname(image.path).replace('.', '')
        const dirPath = _resolveDirPath(image.path)

        // 项目绝对路径
        const basePath = normalizePath(path.dirname(cwd))
        // 工作区绝对路径
        const absWorkspaceFolder = normalizePath(cwd)

        const imageInfo: ImageType = {
          name: image.name,
          path: image.path,
          stats: image.stats!,
          basePath,
          dirPath,
          absDirPath: normalizePath(path.dirname(image.path)),
          fileType,
          vscodePath: isBase64(vscodePath) ? vscodePath : `${vscodePath}?t=${image.stats?.mtime.getTime()}`,
          workspaceFolder: normalizePath(path.basename(cwd)),
          absWorkspaceFolder,
          relativePath:
            Global.rootpaths.length > 1
              ? normalizePath(path.relative(basePath, image.path)) // 多工作区，相对于项目
              : normalizePath(path.relative(absWorkspaceFolder, image.path)), // 单工作区，相对于工作区
          extraPathInfo: path.parse(image.path),
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

    async function _searchImages(
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

      return await VscodeMessageCenter[CmdToVscode.get_image](
        {
          glob: allImagePatterns,
          cwd: absWorkspaceFolder,
          onResolve: (image) => {
            const { fileType, dirPath } = image
            fileTypes && fileTypes.add(fileType)
            dirPath && dirs.add(dirPath)
          },
        },
        webview,
      )
    }

    try {
      const data = await Promise.all(
        absWorkspaceFolders.map(async (workspaceFolder) => {
          const fileTypes: Set<string> = new Set()
          const dirs: Set<string> = new Set()

          const images = await _searchImages(workspaceFolder, webview, fileTypes, dirs)
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
        glob: filePath,
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
    const compressor = Global.compressor
    return compressor
  },

  /* ----------- get format converter ----------- */
  [CmdToVscode.get_format_converter]: async () => {
    const formatConverter = Global.formatConverter
    return formatConverter
  },

  /* ------- open path in vscode explorer ------ */
  [CmdToVscode.open_image_in_vscode_explorer]: (data: { filePath: string }) => {
    const res = commands.executeCommand('revealInExplorer', Uri.file(data.filePath))
    return res
  },

  /* --------- open path in os explorer -------- */
  [CmdToVscode.open_image_in_os_explorer]: async (data: { filePath: string }) => {
    const { filePath } = data
    let targetPath = filePath
    if (Config.file_revealFileInOsDeeply) {
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
      Channel.error(`${i18n.t('core.copy_base64_error')}: ${toString(e)}`)
      return ''
    }
  },

  /* -------------- compress image -------------- */
  [CmdToVscode.compress_image]: async (data: {
    filePaths: string[]
    option?: CompressionOptions
  }): Promise<OperatorResult | undefined> => {
    try {
      const { filePaths, option } = data
      Channel.debug(`Compress params: ${JSON.stringify(data)}`)
      const { compressor } = Global
      const res = await compressor?.run(filePaths, option)
      Channel.debug(`Compress result: ${JSON.stringify(res)}`)
      return res
    } catch (e: any) {
      Channel.debug(`${i18n.t('core.compress_error')}: ${JSON.stringify(e)}`)
      return e
    }
  },

  /* ----------- convert image format ----------- */
  [CmdToVscode.convert_image_format]: async (data: {
    filePaths: string[]
    option: FormatConverterOptions
  }): Promise<OperatorResult | undefined> => {
    try {
      const { filePaths, option } = data
      Channel.debug(`Convert params: ${JSON.stringify(data)}`)
      const { formatConverter } = Global
      const res = await formatConverter?.run(filePaths, option)
      Channel.debug(`Convert result: ${JSON.stringify(res)}`)
      return res
    } catch (e: any) {
      Channel.debug(`Convert error: ${JSON.stringify(e)}`)
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

  /* ------------ get image metadata ------------ */
  [CmdToVscode.get_image_metadata]: async (data: { filePath: string }) => {
    const { filePath } = data

    let compressed = false
    let metadata: SharpNS.Metadata = {} as SharpNS.Metadata

    try {
      await fs.exists(filePath)
    } catch {
      return {
        metadata,
        compressed,
      }
    }

    try {
      Global.sharp.cache({ files: 0 })
      metadata = await Global.sharp(filePath).metadata()
    } catch {
      metadata = imageSize(filePath) as SharpNS.Metadata
    } finally {
      if (metadata.exif) {
        compressed = !!exif(metadata.exif).Image?.ImageDescription?.includes(COMPRESSED_META)
      } else if (path.extname(filePath) === '.svg') {
        compressed = Svgo.isCompressed(await fs.readFile(filePath, 'utf-8'), Config.compression.svg)
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
        Channel.debug(`${i18n.t('core.get_git_staged_error')}: ${e}`)
        return []
      }
    }

    const images = await Promise.all(Global.rootpaths.map((root) => getStagedImages(root)))

    return flatten(images)
  },

  /* --------- update user configuration -------- */
  [CmdToVscode.update_user_configuration]: (data: {
    key: Flatten<ConfigType>
    value: any
    target?: ConfigurationTarget
  }) => {
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

  /* ---------------- pretty svg ---------------- */
  [CmdToVscode.prettify_svg]: async (data: { filePath: string }) => {
    const { filePath } = data
    const svgoConfig = Svgo.processConfig(Config.compression.svg, {
      pretty: true,
    })
    const svgString = await fs.readFile(filePath, 'utf-8')
    const { data: svgStr } = optimize(svgString, svgoConfig)
    await fs.writeFile(filePath, svgStr)
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
  [CmdToVscode.delete_file]: async (data: { filePaths: string[]; recursive?: boolean }) => {
    const { filePaths, recursive } = data
    try {
      await Promise.all(
        filePaths.map((filePath) => workspace.fs.delete(Uri.file(filePath), { useTrash: true, recursive })),
      )
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
    ImageManagerPanel.updateTargetImage(data.filePath)
    return true
  },
  /* --------------- 获取路径下的同级文件(夹)列表 --------------- */
  [CmdToVscode.get_sibling_resource]: async (data: { source: string }) => {
    const { source } = data
    const siblings = await fs.readdir(path.dirname(source))
    return siblings
  },
}
