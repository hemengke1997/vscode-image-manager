import { useSetState } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useState } from 'react'
import { type Compressor } from '~/core/compress'
import { useTrackConfigState } from '~/webview/hooks/useTrackConfigState'
import FrameworkContext from '~/webview/ui-framework/src/contexts/FrameworkContext'
import { type ImageType } from '..'

function useGlobalContext() {
  const { extConfig, setExtConfig, mode, setMode, theme } = FrameworkContext.usePicker([
    'extConfig',
    'setExtConfig',
    'mode',
    'setMode',
    'theme',
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
    setExtConfig,
    imageState,
    setImageState,
    imageWidth,
    setImageWidth,
    imagePlaceholderSize,
    setImagePlaceholderSize,
  }
}

const GlobalContext = createContainer(useGlobalContext)

export default GlobalContext
