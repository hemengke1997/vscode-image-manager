import exif from 'exif-reader'
import fs from 'fs-extra'
import { type GlobEntry } from 'globby'
import imageSize from 'image-size'
import path from 'node:path'
import git from 'simple-git'
import { type Webview } from 'vscode'
import { type SharpNS } from '~/@types/global'
import { COMPRESSED_META, Global, Svgo } from '~/core'
import { Config } from '~/core/config'
import { i18n } from '~/i18n'
import { normalizePath } from '~/utils'
import { Channel } from '~/utils/channel'
import { imageGlob } from '~/utils/glob'
import { CmdToVscode } from './cmd'
import { VscodeMessageCenter } from './message-center'

/**
 * 查找图片
 */
export async function searchImages(
  absWorkspaceFolder: string,
  webview: Webview,
  fileTypes: Set<string>,
  dirs: Set<string>,
) {
  absWorkspaceFolder = normalizePath(absWorkspaceFolder)

  const { allImagePatterns } = imageGlob({
    cwds: [absWorkspaceFolder],
    scan: Config.file_scan,
    exclude: Config.file_exclude,
  })

  return VscodeMessageCenter[CmdToVscode.get_image](
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

/**
 * 获取图片相关信息
 */
export async function getImageExtraInfo(images: GlobEntry[]) {
  const gitStagedPromise = VscodeMessageCenter[CmdToVscode.get_git_staged_images]()

  const metadataPromise = VscodeMessageCenter[CmdToVscode.get_images_metadata]({
    images,
  })

  const [gitStaged, metadataResults] = await Promise.all([gitStagedPromise, metadataPromise])

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
      return cachedData
    }
  }

  const simpleGit = git({ baseDir: root, binary: 'git' })

  try {
    const files = (await simpleGit.diff(['--staged', '--diff-filter=ACMR', '--name-only'])).split('\n')
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
      metadata: SharpNS.Metadata
      compressed: boolean
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
  metadata: SharpNS.Metadata
  compressed: boolean
}> {
  const { path: filePath, stats } = image

  if (isMetadataCacheValid(filePath, stats?.mtimeMs)) {
    const cache = metadataCache.get(filePath)
    if (cache) {
      return cache.data
    }
  }

  let compressed = false
  let metadata: SharpNS.Metadata = {} as SharpNS.Metadata

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
    Global.sharp.cache({ files: 0 })
    metadata = await Global.sharp(filePath).metadata()
  } catch {
    try {
      metadata = imageSize(filePath) as SharpNS.Metadata
    } catch (e) {
      Channel.error(e)
    }
  } finally {
    if (metadata.exif) {
      compressed = !!exif(metadata.exif).Image?.ImageDescription?.includes(COMPRESSED_META)
    } else if (path.extname(filePath) === '.svg') {
      try {
        const svgString = await fs.readFile(filePath, 'utf-8')
        compressed = Svgo.isCompressed(svgString, Config.compression.svg)
      } catch (e) {
        Channel.error(e)
      }
    }
  }

  metadataCache.set(filePath, {
    mtimeMs: stats?.mtimeMs || 0,
    data: {
      filePath,
      metadata,
      compressed,
    },
  })

  return {
    filePath,
    metadata,
    compressed,
  }
}
