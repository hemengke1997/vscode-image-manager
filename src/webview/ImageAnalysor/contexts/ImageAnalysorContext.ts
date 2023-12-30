import { TinyColor } from '@ctrl/tinycolor'
import { useControlledState, useLocalStorageState, useSetState } from '@minko-fe/react-hook'
import { type ConfigType } from '@root/config'
import { defaultConfig } from '@root/config/default'
import { CmdToVscode } from '@root/message/shared'
import { localStorageEnum } from '@root/webview/local-storage'
import GlobalContext from '@root/webview/ui-framework/src/contexts/GlobalContext'
import { vscodeApi } from '@root/webview/vscode-api'
import { createContainer } from 'context-state'
import { useEffect, useReducer, useState } from 'react'
import { type ImageType } from '..'
import { Colors } from '../utils/color'

export type ImageStateType = {
  originalList: ImageType[]
  list: ImageType[]
  loading: boolean
}

function useImageAnalysorContext() {
  const { theme } = GlobalContext.useSelector((ctx) => ctx.appearance.theme)

  /* ------------- extension config ------------- */
  const [config, setConfig] = useState<ConfigType>(defaultConfig)
  useEffect(() => {
    vscodeApi.postMessage({ cmd: CmdToVscode.GET_EXT_CONFIG }, (data) => {
      setConfig(data)
    })
  }, [])

  /* --------------- images state --------------- */
  const [images, setImages] = useSetState<ImageStateType>({ originalList: [], list: [], loading: true })

  const [imageRefreshTimes, refreshImages] = useReducer((s: number) => s + 1, 0)

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
  const [collapseOpen, setCollapseOpen] = useControlledState<number>({
    defaultValue: 0,
    beforeValue(value, prevValue) {
      if (value > prevValue) {
        return Math.abs(value) || 1
      } else {
        return -Math.abs(value)
      }
    },
  })

  return {
    config,
    images,
    setImages,
    imageRefreshTimes,
    refreshImages,
    scale,
    setScale,
    backgroundColor,
    setBackgroundColor,
    tinyBackgroundColor,
    isDarkBackground,
    collapseOpen,
    setCollapseOpen,
  }
}

const ImageAnalysorContext = createContainer(useImageAnalysorContext)

export default ImageAnalysorContext
