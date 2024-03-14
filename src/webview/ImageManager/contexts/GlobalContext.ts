import { useSetState } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useState } from 'react'
import { type Compressor } from '~/core/compress'
import { useTrackConfigState } from '~/webview/hooks/useTrackConfigState'
import FrameworkContext from '~/webview/ui-framework/src/contexts/FrameworkContext'
import { type ImageType } from '..'
import { type ImageFilterAction } from '../components/ImageActions/components/Filter'

/**
 * 筛选条件
 *
 * @description key: ImageVisibleFilterType 一一对应，方便使用
 *
 * ImageFilterAction: 来源于 imageAction 的 form filter
 *
 * type: 来源于 settings 的 imageType
 */
export type ImageFilterType = ImageFilterAction & {
  type: string[]
}

function useGlobalContext() {
  const { extConfig, mode, setMode, theme } = FrameworkContext.usePicker(['extConfig', 'mode', 'setMode', 'theme'])

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
    type: [],
  })

  /* ---------------- image width --------------- */
  const [imageWidth, setImageWidth] = useTrackConfigState<number>(extConfig.viewer.imageWidth)

  /* ---------- image placeholder size ---------- */
  const [imagePlaceholderSize, setImagePlaceholderSize] = useState<{ width: number; height: number }>()

  return {
    mode,
    setMode,
    theme,
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
