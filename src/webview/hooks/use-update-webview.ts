import { useMemoizedFn } from 'ahooks'
import { CmdToVscode } from '~/message/cmd'
import VscodeContext from '../ui-framework/src/contexts/vscode-context'
import { vscodeApi } from '../vscode-api'

/**
 * 手动更新webview从vscode中获取的配置
 *
 * 包括：
 * 1. extension 配置
 * 2. vscode 配置
 * 3. workspace state
 */
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

  const updateWorkspaceState = useMemoizedFn((allImageTypes: string[]) => {
    vscodeApi.postMessage(
      {
        cmd: CmdToVscode.get_workspace_state,
      },
      (data) => {
        if (data) {
          setWorkspaceState({
            ...data,
            display_type: {
              checked: allImageTypes,
              unchecked: [],
            },
          })
        }
      },
    )
  })

  return {
    updateConfig,
    updateWorkspaceState,
  }
}
