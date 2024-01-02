import { TinyColor } from '@ctrl/tinycolor'
import {
  useControlledState,
  useLocalStorageState,
  useMemoizedFn,
  useSetState,
  useUpdateEffect,
} from '@minko-fe/react-hook'
import { type ConfigType } from '@root/config'
import { defaultConfig } from '@root/config/default'
import { CmdToVscode } from '@root/message/shared'
import { localStorageEnum } from '@root/webview/local-storage'
import GlobalContext from '@root/webview/ui-framework/src/contexts/GlobalContext'
import { vscodeApi } from '@root/webview/vscode-api'
import { createContainer } from 'context-state'
import { useEffect, useReducer, useState } from 'react'
import { type ImageType } from '..'
import { shouldShowImage } from '../utils'
import { Colors } from '../utils/color'

export type ImageStateType = {
  originalList: ImageType[]
  list: ImageType[]
  visibleList: ImageType[]
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
  const [images, setImages] = useSetState<ImageStateType>({
    originalList: [],
    list: [],
    visibleList: [],
    loading: true,
  })

  useUpdateEffect(() => {
    setImages((t) => ({ visibleList: t.list.filter(shouldShowImage) }))
  }, [images.list])

  const refreshImageReducer = useMemoizedFn(
    (state: { refreshTimes: number }, action: { type: 'refresh' | 'sort' | undefined }) => {
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

  // negative number means close collapse
  // otherwise, open collapse
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
  }
}

const ImageAnalysorContext = createContainer(useImageAnalysorContext)

export default ImageAnalysorContext
