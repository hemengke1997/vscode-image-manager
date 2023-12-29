import { type ConfigType } from '@root/config'
import { defaultConfig } from '@root/config/default'
import { CmdToVscode } from '@root/message/shared'
import { vscodeApi } from '@root/webview/vscode-api'
import { createContainer } from 'context-state'
import { useEffect, useState } from 'react'

function useImageAnalysorContext() {
  /* ------------- extension config ------------- */
  const [config, setConfig] = useState<ConfigType>(defaultConfig)
  useEffect(() => {
    vscodeApi.postMessage({ cmd: CmdToVscode.GET_EXT_CONFIG }, (data) => {
      setConfig(data)
    })
  }, [])

  return { config }
}

const ImageAnalysorContext = createContainer(useImageAnalysorContext)

export default ImageAnalysorContext
