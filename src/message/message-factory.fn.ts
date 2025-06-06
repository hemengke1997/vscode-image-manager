import { isString } from 'antd/es/button'
import readExif from 'exif-reader'
import fs from 'fs-extra'
import { type GlobEntry } from 'globby'
import { imageSizeFromFile } from 'image-size/fromFile'
import path from 'node:path'
import git from 'simple-git'
import { type SharpNS } from '~/@types/global'
import { Config } from '~/core/config/config'
import { Global } from '~/core/global'
import { COMPRESSED_META } from '~/core/operator/meta'
import { Svgo } from '~/core/operator/svgo'
import { Compressed } from '~/enums'
import { i18n } from '~/i18n'
import { Channel } from '~/utils/node/channel'

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
    const [gitRoot, files] = await Promise.all([
      simpleGit.revparse(['--show-toplevel']),
      simpleGit.diff(['--cached', '--diff-filter=ACMR', '--name-only']),
    ])

    const imageFiles = files
      .split('\n')
      .filter((file) => Config.file_scan.includes(path.extname(file).slice(1)))
      .map((file) => path.join(gitRoot, file))

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
export async function getImageMetadata(image: string | GlobEntry): Promise<{
  filePath: string
  metadata: Metadata
  compressed: Compressed
}> {
  let filePath = ''
  let stats: fs.Stats | undefined
  if (isString(image)) {
    filePath = image
    try {
      stats = await fs.stat(filePath)
    } catch {}
  } else {
    filePath = image.path
    stats = image.stats
  }

  if (isMetadataCacheValid(filePath, stats?.mtimeMs)) {
    const cache = metadataCache.get(filePath)
    if (cache) {
      return cache.data
    }
  }

  let compressed = Compressed.no
  let metadata: SharpNS.Metadata = {} as SharpNS.Metadata
  let sharpFormatSupported = true

  try {
    if (!Global.sharp) {
      throw new Error('sharp is not installed')
    }

    metadata = await Global.sharp?.(filePath).metadata()
  } catch {
    // sharp 不支持该类型
    sharpFormatSupported = false

    try {
      metadata = ((await imageSizeFromFile(filePath).catch(() => {})) || {}) as SharpNS.Metadata
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
