import { TinyColor } from '@ctrl/tinycolor'
import { useControlledState, useLocalStorageState, useMemoizedFn, useSetState } from '@minko-fe/react-hook'
import { type AbsCompressor } from '@rootSrc/compress/AbsCompressor'
import { type ConfigType } from '@rootSrc/config'
import { defaultConfig } from '@rootSrc/config/default'
import { CmdToVscode } from '@rootSrc/message/shared'
import { localStorageEnum } from '@rootSrc/webview/local-storage'
import GlobalContext from '@rootSrc/webview/ui-framework/src/contexts/GlobalContext'
import { vscodeApi } from '@rootSrc/webview/vscode-api'
import { App } from 'antd'
import { createContainer } from 'context-state'
import { useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type ImageType } from '..'
import { Colors } from '../utils/color'

function useImageManagerContext() {
  const { theme } = GlobalContext.usePicker(['theme'])
  const { message } = App.useApp()
  const { t } = useTranslation()

  /* ------------- extension config ------------- */
  const [config, setConfig] = useState<ConfigType>(defaultConfig)
  useEffect(() => {
    vscodeApi.postMessage({ cmd: CmdToVscode.GET_EXT_CONFIG }, (data) => {
      setConfig(data)
    })
  }, [])

  /* ------------- extension context ------------ */
  const [compressor, setCompressor] = useState<AbsCompressor>()
  useEffect(() => {
    vscodeApi.postMessage({ cmd: CmdToVscode.GET_COMPRESSOR }, (data) => {
      if (!data) {
        message.error(t('ia.compressor_not_found'))
      }
      setCompressor(data)
    })
  }, [])

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

  const refreshImageReducer = useMemoizedFn(
    (state: { refreshTimes: number }, action: { type: 'refresh' | 'sort' | 'slientRefresh' | undefined }) => {
      return {
        refreshTimes: state.refreshTimes + 1,
        refreshType: action?.type,
      }
    },
  )

  const [imageRefreshedState, refreshImages] = useReducer(refreshImageReducer, {
    refreshTimes: 0,
    refreshType: undefined,
  })

  /* ---------------- image scale --------------- */
  const [scale, setScale] = useLocalStorageState<number>(localStorageEnum.LOCAL_STORAGE_IMAGE_SIZE_SCALE, {
    defaultValue: 1,
  })

  /* ----------- image backgroundColor ---------- */
  const [backgroundColor, setBackgroundColor] = useLocalStorageState<string>(
    localStorageEnum.LOCAL_STORAGE_BACKGROUND_COLOR_KEY,
    {
      defaultValue: theme === 'dark' ? Colors.warmWhite : Colors.warmBlack,
    },
  )

  const tinyBackgroundColor = new TinyColor(backgroundColor)
  const isDarkBackground = tinyBackgroundColor.isDark()

  /* -------------- image collapse -------------- */

  // Negative number means close collapse
  // otherwise, open collapse
  // Zero means no change
  const [collapseOpen, setCollapseOpen] = useControlledState<number>({
    defaultValue: 0,
    beforeValue(value, prevValue) {
      if (value > prevValue) {
        return Math.abs(value) || 1
      } else {
        return -Math.abs(value) || -1
      }
    },
  })

  /* ---------- image placeholder size ---------- */
  const [imagePlaceholderSize, setImagePlaceholderSize] = useState<{ width: number; height: number }>()

  return {
    compressor,
    config,
    imageState,
    setImageState,
    imageRefreshedState,
    refreshImages,
    scale,
    setScale,
    backgroundColor,
    setBackgroundColor,
    tinyBackgroundColor,
    isDarkBackground,
    collapseOpen,
    setCollapseOpen,
    imagePlaceholderSize,
    setImagePlaceholderSize,
  }
}

const ImageManagerContext = createContainer(useImageManagerContext)

export default ImageManagerContext
