import { useSetState } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useState } from 'react'
import { type Compressor } from '~/core/compress'
import { ConfigKey } from '~/core/config/common'
import { useExtConfigState } from '~/webview/hooks/useExtConfigState'
import FrameworkContext from '~/webview/ui-framework/src/contexts/FrameworkContext'
import { type ImageType, type ImageVisibleFilterType } from '..'
import { type DisplayTypeFilter } from '../components/DisplayType'
import { type ImageFilterAction } from '../components/ImageActions/components/Filter'

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

function useGlobalContext() {
  const { extConfig, mode, setMode, theme, workspaceState } = FrameworkContext.usePicker([
    'extConfig',
    'mode',
    'setMode',
    'theme',
    'workspaceState',
  ])

  /* ------------- image compressor ------------ */
  const [compressor, setCompressor] = useState<Compressor>()

  /* --------------- images state --------------- */
  const [imageState, setImageState] = useSetState<{
    loading: boolean
    workspaceFolders: string[]
    data: {
      imgs: ImageType[]
      workspaceFolder: string
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

  return {
    mode,
    setMode,
    theme,
    workspaceState,
    compressor,
    setCompressor,
    extConfig,
    imageState,
    setImageState,
    imageWidth,
    setImageWidth,
    imagePlaceholderSize,
    setImagePlaceholderSize,
    imageFilter,
    setImageFilter,
  }
}

const GlobalContext = createContainer(useGlobalContext)

export default GlobalContext
