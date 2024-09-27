import { useMemo, useState } from 'react'
import { useSetState } from 'ahooks'
import { createContainer } from 'context-state'
import { type FormatConverterOptions } from '~/core'
import { ConfigKey } from '~/core/config/common'
import { type CompressionOptions } from '~/core/operator/compressor/type'
import { useExtConfigState } from '~/webview/hooks/use-ext-config-state'
import VscodeContext from '~/webview/ui-framework/src/contexts/vscode-context'
import { type ImageFilterAction } from '../components/image-actions/components/filter'
import { type DisplayTypeFilter } from '../hooks/use-settings/settings/components/display-type'

type RestrictHelper = {
  [key in ImageVisibleFilterType]?: any
}

export type RestrictImageFilterType<T extends RestrictHelper> = T

/**
 * 筛选条件
 *
 * @description 对象的key 与 ImageVisibleFilterType 一一对应，方便使用
 *
 * ImageFilterAction: 来源于 imageAction 的 form filter
 *
 * DisplayTypeFilter: 来源于 settings 的 image file type
 */

export type ImageFilterType = ImageFilterAction & DisplayTypeFilter

export type WebviewCompressorType = {
  option: CompressionOptions
  limit: {
    from: string[]
    to: string[]
  }
}

export type WebviewFormatConverterType = {
  option: FormatConverterOptions
  limit: {
    from: string[]
    to: string[]
  }
}

function useGlobalContext() {
  const { extConfig, workspaceState, vscodeConfig } = VscodeContext.usePicker([
    'extConfig',
    'workspaceState',
    'vscodeConfig',
  ])

  /* ------------- image compressor ------------ */
  const [compressor, setCompressor] = useState<WebviewCompressorType>()
  /* ---------- image format converter ---------- */
  const [formatConverter, setFormatConverter] = useState<WebviewFormatConverterType>()

  /* --------------- images state --------------- */
  const [imageState, setImageState] = useSetState<{
    loading: boolean
    workspaceFolders: string[]
    data: {
      images: ImageType[]
      workspaceFolder: string
      absWorkspaceFolder: string
      fileTypes: string[]
      dirs: string[]
    }[]
  }>({
    loading: true,
    workspaceFolders: [],
    data: [],
  })

  /* ---------------- image filter --------------- */
  const [imageFilter, setImageFilter] = useState<ImageFilterType>({
    // action 中的 filter
    size: {
      max: undefined,
      min: undefined,
    },
    compressed: 0,
    git_staged: 0,

    // viewer设置中的 display type
    file_type: [],
  })

  /* ---------------- image width --------------- */
  const [imageWidth, setImageWidth] = useExtConfigState(ConfigKey.viewer_imageWidth, extConfig.viewer.imageWidth)

  /* ---------- image placeholder size ---------- */
  const [imagePlaceholderSize, setImagePlaceholderSize] = useState<{ width: number; height: number }>()

  /* ---------- reveal image path ---------- */
  /**
   * @note imageReveal 是带t query参数的，用于处理同一张图片的情况
   */
  const [imageReveal, setImageReveal] = useState<string | undefined>(window.__reveal_image_path__)
  const imageRevealWithoutQuery = useMemo(() => {
    if (!imageReveal) return ''
    const index = imageReveal.lastIndexOf('?')
    if (index !== -1) return imageReveal.slice(0, index)
    return imageReveal
  }, [imageReveal])

  /* ----------------- dir reveal ----------------- */
  const [dirReveal, setDirReveal] = useState<string>('')

  /* ------------- tree context 中的数据 ------------ */
  const [treeData, setTreeData] = useState<{ workspaceFolder: string; visibleList: ImageType[] }[]>([])

  /* ------------ 图片sticky header的高度 ------------ */
  const [viewerHeaderStickyHeight, setViewerHeaderStickyHeight] = useState<number>(0)

  /* ----------------- 项目中所有图片类型 ---------------- */
  const allImageTypes = useMemo(() => imageState.data.flatMap((item) => item.fileTypes), [imageState.data])

  return {
    vscodeConfig,
    workspaceState,
    compressor,
    setCompressor,
    formatConverter,
    setFormatConverter,
    extConfig,
    imageState,
    setImageState,
    imageWidth,
    setImageWidth,
    imagePlaceholderSize,
    setImagePlaceholderSize,
    imageFilter,
    setImageFilter,
    imageReveal,
    setImageReveal,
    imageRevealWithoutQuery,
    treeData,
    setTreeData,
    viewerHeaderStickyHeight,
    setViewerHeaderStickyHeight,
    dirReveal,
    setDirReveal,
    allImageTypes,
  }
}

const GlobalContext = createContainer(useGlobalContext)

export default GlobalContext
