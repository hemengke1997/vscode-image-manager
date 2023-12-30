import { TinyColor } from '@ctrl/tinycolor'
import { useLocalStorageState, useSetState } from '@minko-fe/react-hook'
import { type ConfigType } from '@root/config'
import { defaultConfig } from '@root/config/default'
import { CmdToVscode } from '@root/message/shared'
import { localStorageEnum } from '@root/webview/local-storage'
import { vscodeApi } from '@root/webview/vscode-api'
import { createContainer } from 'context-state'
import { useEffect, useReducer, useState } from 'react'
import { type ImageType } from '..'

export type ImageStateType = {
  originalList: ImageType[]
  list: ImageType[]
  loading: boolean
}

function useImageAnalysorContext() {
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
      defaultValue: '#fff',
    },
  )

  const tinyBackgroundColor = new TinyColor(backgroundColor)
  const isDarkBackground = tinyBackgroundColor.isDark()

  /* -------------- image collapse -------------- */
  const [collapseOpen, setCollapseOpen] = useState<boolean>(false)

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
