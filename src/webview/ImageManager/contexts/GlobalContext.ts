import { useLocalStorageState, useSetState } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useEffect, useRef, useState } from 'react'
import { type AbsCompressor } from '@/compress/AbsCompressor'
import { type ConfigType } from '@/config'
import { defaultConfig } from '@/config/default'
import { CmdToVscode } from '@/message/constant'
import { LocalStorageEnum } from '@/webview/local-storage'
import { vscodeApi } from '@/webview/vscode-api'
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
      if (!data && !compressor) {
        // polling
        compressorTimer.current = setTimeout(() => {
          getCompressor()
        }, 1000)
      } else {
        compressorTimer.current && clearTimeout(compressorTimer.current)
        data && setCompressor(data)
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
  const [scale, setScale] = useLocalStorageState<number>(LocalStorageEnum.LOCAL_STORAGE_IMAGE_SIZE_SCALE, {
    defaultValue: 1,
  })

  /* ---------- image placeholder size ---------- */
  const [imagePlaceholderSize, setImagePlaceholderSize] = useState<{ width: number; height: number }>()

  return {
    compressor,
    setCompressor,
    config,
    imageState,
    setImageState,
    scale,
    setScale,
    imagePlaceholderSize,
    setImagePlaceholderSize,
  }
}

const GlobalContext = createContainer(useGlobalContext)

export default GlobalContext
