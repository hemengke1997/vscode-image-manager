import { useSetState } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useMemo, useState } from 'react'
import { type FormatConverterOptions } from '~/core'
import { ConfigKey } from '~/core/config/common'
import { type CompressionOptions } from '~/core/operator/compressor/type'
import { useExtConfigState } from '~/webview/hooks/use-ext-config-state'
import FrameworkContext from '~/webview/ui-framework/src/contexts/framework-context'
import { type DisplayTypeFilter } from '../components/display-type'
import { type ImageFilterAction } from '../components/image-actions/components/filter'

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
  const { extConfig, mode, setMode, theme, workspaceState } = FrameworkContext.usePicker([
    'extConfig',
    'mode',
    'setMode',
    'theme',
    'workspaceState',
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
    size: {
      max: undefined,
      min: undefined,
    },
    compressed: 0,
    git_staged: 0,
    file_type: [],
  })

  /* ---------------- image width --------------- */
  const [imageWidth, setImageWidth] = useExtConfigState(ConfigKey.viewer_imageWidth, extConfig.viewer.imageWidth)

  /* ---------- image placeholder size ---------- */
  const [imagePlaceholderSize, setImagePlaceholderSize] = useState<{ width: number; height: number }>()

  /* ---------- target image path ---------- */
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

  /* ------------- tree context 中的数据 ------------ */
  const [treeData, setTreeData] = useState<{ workspaceFolder: string; visibleList: ImageType[] }[]>([])

  /* ------------ 图片sticky header的高度 ------------ */
  const [viewerHeaderStickyHeight, setViewerHeaderStickyHeight] = useState<number>(0)

  return {
    mode,
    setMode,
    theme,
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
  }
}

const GlobalContext = createContainer(useGlobalContext)

export default GlobalContext
