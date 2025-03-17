import readExif from 'exif-reader'
import fs from 'fs-extra'
import { type GlobEntry } from 'globby'
import { imageSizeFromFile } from 'image-size/fromFile'
import path from 'node:path'
import git from 'simple-git'
import { type Webview } from 'vscode'
import { type SharpNS } from '~/@types/global'
import { COMPRESSED_META, Global, Svgo } from '~/core'
import { Config } from '~/core/config'
import { Compressed } from '~/enums'
import { i18n } from '~/i18n'
import { normalizePath } from '~/utils'
import { Channel } from '~/utils/channel'
import { imageGlob } from '~/utils/glob'
import { CmdToVscode } from './cmd'
import { VscodeMessageCenter } from './message-factory'

/**
 * 查找图片
 */
export async function searchImages(absWorkspaceFolder: string, webview: Webview, exts: Set<string>, dirs: Set<string>) {
  absWorkspaceFolder = normalizePath(absWorkspaceFolder)

  const { allImagePatterns } = imageGlob({
    cwds: [absWorkspaceFolder],
    scan: Config.file_scan,
    exclude: Config.file_exclude,
  })

  return VscodeMessageCenter[CmdToVscode.get_image_info](
    {
      glob: allImagePatterns,
      cwd: absWorkspaceFolder,
      onResolve: (image) => {
        const { extname, dirPath } = image
        exts && exts.add(extname)
        dirPath && dirs.add(dirPath)
      },
    },
    webview,
  )
}

/**
 * 获取图片相关信息
 */
export async function getImageExtraInfo(images: GlobEntry[]) {
  const [gitStaged, metadataResults] = await Promise.all([
    VscodeMessageCenter[CmdToVscode.get_git_staged_images](),
    VscodeMessageCenter[CmdToVscode.get_images_metadata]({
      images,
    }),
  ])

  return {
    gitStaged,
    metadataResults,
  }
}

const gitStagedCache = new Map<string, { timestamp: number; data: string[] }>()
const GIT_CACHE_DURATION = 10 * 1000 // 10s
/**
 * 获取 git staged 中的图片
 */
export async function getStagedImages(root: string) {
  const cacheKey = root

  const currentCache = gitStagedCache.get(cacheKey)
  if (currentCache && Date.now() - currentCache.timestamp < GIT_CACHE_DURATION) {
    const cachedData = currentCache.data
    if (cachedData.length) {
      Channel.debug('Get git staged images from cache')
      return cachedData
    }
  }

  const simpleGit = git({ baseDir: root, binary: 'git' })

  try {
    const files = (await simpleGit.diff(['--cached', '--diff-filter=ACMR', '--name-only'])).split('\n')
    // Filter out non-image files
    let imageFiles = files.filter((file) => Config.file_scan.includes(path.extname(file).slice(1)))
    // Add the full path to the file
    const gitRoot = await simpleGit.revparse(['--show-toplevel'])
    imageFiles = imageFiles.map((file) => path.join(gitRoot, file))

    gitStagedCache.set(cacheKey, {
      timestamp: Date.now(),
      data: imageFiles,
    })

    return imageFiles
  } catch (e) {
    Channel.debug(`${i18n.t('core.get_git_staged_error')}: ${e}`)
    return []
  }
}

/**
 * 清除 git staged 缓存
 */
export function clearGitStagedCache() {
  gitStagedCache.clear()
}

const metadataCache = new Map<
  string,
  {
    mtimeMs: number
    data: {
      filePath: string
      metadata: Metadata
      compressed: Compressed
    }
  }
>()

/**
 * 检查元数据缓存是否有效
 */
function isMetadataCacheValid(filePath: string, mtimeMs: number | undefined) {
  if (!mtimeMs) {
    return false
  }
  const cache = metadataCache.get(filePath)
  if (cache && cache.mtimeMs === mtimeMs) {
    return true
  }
  return false
}

/**
 * 获取图片元信息
 */
export async function getImageMetadata(image: GlobEntry): Promise<{
  filePath: string
  metadata: Metadata
  compressed: Compressed
}> {
  const { path: filePath, stats } = image

  if (isMetadataCacheValid(filePath, stats?.mtimeMs)) {
    const cache = metadataCache.get(filePath)
    if (cache) {
      return cache.data
    }
  }

  let compressed = Compressed.no
  let metadata: SharpNS.Metadata = {} as SharpNS.Metadata
  let sharpFormatSupported = true

  const initialRes = {
    filePath,
    metadata,
    compressed,
  }

  try {
    await fs.access(filePath)
  } catch {
    return initialRes
  }

  try {
    if (!Global.sharp) {
      throw new Error('sharp is not installed')
    }

    Global.sharp?.cache({ files: 0 })
    metadata = await Global.sharp?.(filePath).metadata()
  } catch {
    // sharp 不支持该类型
    sharpFormatSupported = false

    try {
      metadata = (await imageSizeFromFile(filePath).catch(() => {})) || {}
    } catch (e) {
      Channel.error(e)
    }
  } finally {
    if (metadata.exif) {
      if (readExif(metadata.exif).Image?.ImageDescription?.includes(COMPRESSED_META)) {
        compressed = Compressed.yes
      }
    } else {
      if (sharpFormatSupported) {
        // 已知支持 exif 的格式
        const exifSupported = ['png', 'webp', 'jpg', 'jpeg', 'avif']

        // 已知不支持 exif 的格式

        // https://github.com/lovell/sharp/issues/3074#issuecomment-1030257856
        // EXIF metadata is unsupported for TIFF output.
        const exifNotSupported = ['svg', 'gif', 'tif', 'tiff']

        if (exifSupported.includes(metadata.format!)) {
          compressed = Compressed.no
        } else {
          if (exifNotSupported.includes(metadata.format!)) {
            // 不支持 exif
            // 无法判断是否压缩
            compressed = Compressed.unknown
          } else {
            // 不知道是否支持 exif 的格式
            // 用sharp推断
            // 可能会影响性能
            try {
              const buffer = await Global.sharp?.(filePath)
                .withExifMerge({
                  IFD0: {
                    ImageDescription: ' ',
                  },
                })
                .toBuffer()
              const m = await Global.sharp?.(buffer).metadata()
              if (m && m.exif && readExif(m.exif).Image?.ImageDescription) {
                // 此类型支持 exif
                // 但是没有压缩标记
                compressed = Compressed.no
              } else {
                // 此类型不支持 exif
                // 无法判断是否压缩
                compressed = Compressed.unknown
              }
            } catch {
              compressed = Compressed.not_supported
            }
          }
        }
      } else {
        // sharp 不支持的格式
        compressed = Compressed.not_supported
      }
    }

    if (metadata.format === 'svg') {
      try {
        const svgString = await fs.readFile(filePath, 'utf-8')
        compressed = Svgo.isCompressed(svgString, Config.compression.svg) ? Compressed.yes : Compressed.no
      } catch (e) {
        Channel.error(e)
      }
    }
  }

  metadataCache.set(filePath, {
    mtimeMs: stats?.mtimeMs || 0,
    data: {
      filePath,
      metadata: {
        width: metadata.width,
        height: metadata.height,
      },
      compressed,
    },
  })

  return {
    filePath,
    metadata,
    compressed,
  }
}
