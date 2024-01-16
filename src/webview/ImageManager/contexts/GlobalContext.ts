import { useLocalStorageState, useSetState } from '@minko-fe/react-hook'
import { type AbsCompressor } from '@rootSrc/compress/AbsCompressor'
import { type ConfigType } from '@rootSrc/config'
import { defaultConfig } from '@rootSrc/config/default'
import { CmdToVscode } from '@rootSrc/message/constant'
import { localStorageEnum } from '@rootSrc/webview/local-storage'
import { vscodeApi } from '@rootSrc/webview/vscode-api'
import { createContainer } from 'context-state'
import { useEffect, useRef, useState } from 'react'
import { type ImageType } from '..'

function useGlobalContext() {
  /* ------------- extension config ------------- */
  const [config, setConfig] = useState<ConfigType>(defaultConfig)
  useEffect(() => {
    vscodeApi.postMessage({ cmd: CmdToVscode.GET_EXT_CONFIG }, (data) => {
      setConfig(data)
    })
  }, [])

  /* ------------- image compressor ------------ */
  const [compressor, setCompressor] = useState<AbsCompressor>()
  const compressorTimer = useRef<NodeJS.Timeout>()
  const getCompressor = () => {
    vscodeApi.postMessage({ cmd: CmdToVscode.GET_COMPRESSOR }, (data) => {
      if (!data) {
        // polling
        compressorTimer.current = setTimeout(() => {
          getCompressor()
        }, 1000)
      } else {
        compressorTimer.current && clearTimeout(compressorTimer.current)
        setCompressor(data)
      }
    })
  }

  useEffect(() => {
    getCompressor()
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
