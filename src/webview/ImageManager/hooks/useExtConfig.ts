import { CmdToVscode } from '~/message/cmd'
import FrameworkContext from '~/webview/ui-framework/src/contexts/FrameworkContext'
import { vscodeApi } from '~/webview/vscode-api'

export function useExtConfig() {
  const { setExtConfig, extConfig, setVscodeConfig, vscodeConfig } = FrameworkContext.usePicker([
    'setExtConfig',
    'extConfig',
    'setVscodeConfig',
    'vscodeConfig',
  ])

  const updateExtConfig = () => {
    vscodeApi.postMessage({ cmd: CmdToVscode.GET_EXT_CONFIG }, (data) => {
      if (data) {
        setExtConfig(data.ext)
        setVscodeConfig(data.vscode)
      }
    })
  }

  return {
    updateExtConfig,
    extConfig,
    vscodeConfig,
  }
}
