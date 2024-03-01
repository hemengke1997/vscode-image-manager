import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '~/webview/vscode-api'
import GlobalContext from '../contexts/GlobalContext'

export function useExtConfig() {
  const { setExtConfig } = GlobalContext.usePicker(['setExtConfig'])

  const updateExtConfig = () => {
    vscodeApi.postMessage({ cmd: CmdToVscode.GET_EXT_CONFIG }, (data) => {
      if (data) {
        setExtConfig(data)
      }
    })
  }

  return {
    updateExtConfig,
  }
}
