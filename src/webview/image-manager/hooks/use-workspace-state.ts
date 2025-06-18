import type { DependencyList } from 'react'
import type { WorkspaceStateKey } from '~/core/persist/workspace/common'
import { useMemoizedFn } from 'ahooks'
import { set } from 'es-toolkit/compat'
import { produce } from 'immer'
import { useSetAtom } from 'jotai'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '../../vscode-api'
import { VscodeAtoms } from '../stores/vscode/vscode-store'
import { useTrackState } from './use-track-state'

/**
 *
 * 追踪 workspaceState 中的某个值
 * workspaceState 中的值始终与 vscode 中的 workspaceState 保持一致
 * 使用 setState 修改值时，会自动更新 vscode 中的 workspaceState
 *
 * 此hook与 use-ext-config-state 逻辑类似
 *
 * @param key workspaceState 的 key
 * @param trackedState 追踪的 workspaceState
 *
 * @param options
 * @param options.deps 依赖项，当依赖项变化时，会重新获取 workspaceState
 * @param options.defaultValue 默认值，当 workspaceState 中没有该 key 时，使用默认值
 */
export function useWorkspaceState<T extends WorkspaceStateKey, U>(
  key: T,
  trackedState: U | (() => U),
  options?: {
    deps?: DependencyList
    defaultValue?: U | (() => U)
  },
) {
  const { deps, defaultValue } = options || {}

  const setWorkspaceState = useSetAtom(VscodeAtoms.workspaceStateAtom)

  const updateWorkspaceState = useMemoizedFn((state: U) => {
    vscodeApi.postMessage({
      cmd: CmdToVscode.update_workspace_state,
      data: {
        key,
        value: state,
      },
    })
  })

  const onChangeBySet = useMemoizedFn((state: U) => {
    setWorkspaceState(
      produce((draft) => {
        set(draft!, key, state)
      }),
    )

    updateWorkspaceState(state)
  })

  const [state, setState] = useTrackState(trackedState, {
    deps,
    defaultValue,
    onChangeBySet,
  })

  return [state, setState] as const
}
