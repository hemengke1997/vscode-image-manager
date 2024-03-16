import { useMemoizedFn } from '@minko-fe/react-hook'
import { CmdToVscode } from '~/message/cmd'
import VscodeContext from '../ui-framework/src/contexts/VscodeContext'
import { vscodeApi } from '../vscode-api'

export default function useUpdateConfig() {
  const { setExtConfig, setVscodeConfig } = VscodeContext.usePicker(['setExtConfig', 'setVscodeConfig'])

  const updateConfig = useMemoizedFn(() => {
    vscodeApi.postMessage({ cmd: CmdToVscode.get_extension_config }, (data) => {
      if (data) {
        setExtConfig(data.ext)
        setVscodeConfig(data.vscode)
      }
    })
  })

  return {
    updateConfig,
  }
}
