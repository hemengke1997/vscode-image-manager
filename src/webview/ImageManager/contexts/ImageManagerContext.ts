import { TinyColor } from '@ctrl/tinycolor'
import {
  useControlledState,
  useLocalStorageState,
  useMemoizedFn,
  useSetState,
  useUpdateEffect,
} from '@minko-fe/react-hook'
import { type ConfigType } from '@rootSrc/config'
import { defaultConfig } from '@rootSrc/config/default'
import { CmdToVscode } from '@rootSrc/message/shared'
import { localStorageEnum } from '@rootSrc/webview/local-storage'
import GlobalContext from '@rootSrc/webview/ui-framework/src/contexts/GlobalContext'
import { vscodeApi } from '@rootSrc/webview/vscode-api'
import { createContainer } from 'context-state'
import { useEffect, useReducer, useState } from 'react'
import { type ImageType } from '..'
import { shouldShowImage } from '../utils'
import { Colors } from '../utils/color'

export type ImageStateType = {
  originalList: ImageType[]
  list: ImageType[]
  visibleList: ImageType[]
  basePath: string
  loading: boolean
}

function useImageManagerContext() {
  const { theme } = GlobalContext.usePicker(['theme'])

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
    basePath: '',
    loading: true,
  })

  useUpdateEffect(() => {
    setImages((t) => ({ visibleList: t.list.filter(shouldShowImage) }))
  }, [images.list])

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

  // negative number means close collapse
  // otherwise, open collapse
  // zero means no change
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

  /* --------------- image select --------------- */
  const [selectedImage, setSelectedImage] = useState<ImageType>()

  /* ---------- image placeholder size ---------- */
  const [imagePlaceholderSize, setImagePlaceholderSize] = useState<{ width: number; height: number }>()

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
    selectedImage,
    setSelectedImage,
    imagePlaceholderSize,
    setImagePlaceholderSize,
  }
}

const ImageManagerContext = createContainer(useImageManagerContext)

export default ImageManagerContext
