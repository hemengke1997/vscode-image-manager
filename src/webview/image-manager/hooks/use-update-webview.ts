import { useMemoizedFn } from 'ahooks'
import { useSetAtom } from 'jotai'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '../../vscode-api'
import { VscodeAtoms } from '../stores/vscode/vscode-store'

/**
 * 手动更新webview从vscode中获取的配置
 *
 * 包括：
 * 1. extension 配置
 * 2. vscode 配置
 * 3. workspace state
 */
export default function useUpdateWebview() {
  const setExtConfig = useSetAtom(VscodeAtoms.extConfigAtom)
  const setVscodeConfig = useSetAtom(VscodeAtoms.vscodeConfigAtom)
  const setWorkspaceState = useSetAtom(VscodeAtoms.workspaceStateAtom)

  const updateConfig = useMemoizedFn(() => {
    vscodeApi.postMessage({ cmd: CmdToVscode.get_extension_config }, (data) => {
      if (data) {
        setExtConfig(data.ext)
        setVscodeConfig(data.vscode)
      }
    })
  })

  const updateWorkspaceState = useMemoizedFn(() => {
    vscodeApi.postMessage(
      {
        cmd: CmdToVscode.get_workspace_state,
      },
      (data) => {
        if (data) {
          setWorkspaceState(data)
        }
      },
    )
  })

  return {
    updateConfig,
    updateWorkspaceState,
  }
}
