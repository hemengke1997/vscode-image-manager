import { useLocalStorageState, useSetState } from '@minko-fe/react-hook'
import { type AbsCompressor } from '@rootSrc/compress/AbsCompressor'
import { type ConfigType } from '@rootSrc/config'
import { defaultConfig } from '@rootSrc/config/default'
import { CmdToVscode } from '@rootSrc/message/constant'
import { localStorageEnum } from '@rootSrc/webview/local-storage'
import { vscodeApi } from '@rootSrc/webview/vscode-api'
import { App } from 'antd'
import { createContainer } from 'context-state'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type ImageType } from '..'

function useGlobalContext() {
  const { message } = App.useApp()
  const { t } = useTranslation()

  /* ------------- extension config ------------- */
  const [config, setConfig] = useState<ConfigType>(defaultConfig)
  useEffect(() => {
    vscodeApi.postMessage({ cmd: CmdToVscode.GET_EXT_CONFIG }, (data) => {
      setConfig(data)
    })
  }, [])

  /* ------------- image compressor ------------ */
  const [compressor, setCompressor] = useState<AbsCompressor>()
  useEffect(() => {
    vscodeApi.postMessage({ cmd: CmdToVscode.GET_COMPRESSOR }, (data) => {
      if (!data) {
        message.error(t('im.compressor_not_found'))
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

  /* ---------------- image scale --------------- */
  const [scale, setScale] = useLocalStorageState<number>(localStorageEnum.LOCAL_STORAGE_IMAGE_SIZE_SCALE, {
    defaultValue: 1,
  })

  /* ---------- image placeholder size ---------- */
  const [imagePlaceholderSize, setImagePlaceholderSize] = useState<{ width: number; height: number }>()

  return {
    compressor,
    config,
    imageState,
    setImageState,
    scale,
    setScale,
    imagePlaceholderSize,
    setImagePlaceholderSize,
  }
}

const BaseContext = createContainer(useGlobalContext)

export default BaseContext
