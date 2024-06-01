import { set } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { produce } from 'immer'
import { type DependencyList } from 'react'
import { type WorkspaceStateKey } from '~/core/persist/workspace/common'
import { CmdToVscode } from '~/message/cmd'
import VscodeContext from '../ui-framework/src/contexts/vscode-context'
import { vscodeApi } from '../vscode-api'
import { useTrackState } from './use-track-state'

/**
 *
 * @param key workspaceState 的 key
 */
export function useWorkspaceState<T extends WorkspaceStateKey, U>(key: T, trackState: U, deps?: DependencyList) {
  const { setWorkspaceState } = VscodeContext.usePicker(['setWorkspaceState'])

  const onChangeBySet = useMemoizedFn(() => {
    setWorkspaceState(
      produce((draft) => {
        set(draft, key, state)
      }),
    )
    vscodeApi.postMessage({
      cmd: CmdToVscode.update_workspace_state,
      data: {
        key,
        value: state,
      },
    })
  })

  const [state, setState] = useTrackState(trackState, {
    deps,
    onChangeBySet,
  })

  return [state, setState] as const
}
