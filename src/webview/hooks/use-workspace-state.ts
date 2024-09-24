import { type DependencyList } from 'react'
import { useDebounceFn, useMemoizedFn } from 'ahooks'
import { produce } from 'immer'
import { set } from 'lodash-es'
import { type WorkspaceStateKey } from '~/core/persist/workspace/common'
import { CmdToVscode } from '~/message/cmd'
import VscodeContext from '../ui-framework/src/contexts/vscode-context'
import { vscodeApi } from '../vscode-api'
import { useTrackState } from './use-track-state'

/**
 *
 * 追踪 workspaceState 中的某个值
 * workspaceState 中的值始终与 vscode 中的 workspaceState 保持一致
 * 使用 setState 修改值时，会自动更新 vscode 中的 workspaceState
 *
 * 此hook与 use-ext-config-state 异曲同工
 *
 * @param key workspaceState 的 key
 * @param trackState 追踪的 workspaceState
 * @param deps 依赖项，当依赖项变化时，会重新获取 workspaceState
 */
export function useWorkspaceState<T extends WorkspaceStateKey, U>(key: T, trackState: U, deps?: DependencyList) {
  const { setWorkspaceState } = VscodeContext.usePicker(['setWorkspaceState'])

  const { run: debounceUpdate } = useDebounceFn(
    (state: U) => {
      vscodeApi.postMessage({
        cmd: CmdToVscode.update_workspace_state,
        data: {
          key,
          value: state,
        },
      })
    },
    {
      wait: 500,
    },
  )

  const onChangeBySet = useMemoizedFn(() => {
    setWorkspaceState(
      produce((draft) => {
        set(draft, key, state)
      }),
    )

    debounceUpdate(state)
  })

  const [state, setState] = useTrackState(trackState, {
    deps,
    onChangeBySet,
  })

  return [state, setState] as const
}
