import { useMemoizedFn } from '@minko-fe/react-hook'
import { flushSync } from 'react-dom'
import { CmdToVscode } from '~/message/cmd'
import VscodeContext from '../ui-framework/src/contexts/VscodeContext'
import { vscodeApi } from '../vscode-api'

export default function useUpdateWebview() {
  const { setExtConfig, setVscodeConfig, setWorkspaceState } = VscodeContext.usePicker([
    'setExtConfig',
    'setVscodeConfig',
    'setWorkspaceState',
  ])

  const updateConfig = useMemoizedFn(() => {
    vscodeApi.postMessage({ cmd: CmdToVscode.get_extension_config }, (data) => {
      if (data) {
        setExtConfig(data.ext)
        setVscodeConfig(data.vscode)
      }
    })
  })

  const updateWorkspaceState = useMemoizedFn(() => {
    return new Promise((resolve) => {
      vscodeApi.postMessage(
        {
          cmd: CmdToVscode.get_workspace_state,
        },
        (data) => {
          if (data) {
            flushSync(() => {
              setWorkspaceState(data)
              resolve(data)
            })
          }
        },
      )
    })
  })

  return {
    updateConfig,
    updateWorkspaceState,
  }
}
