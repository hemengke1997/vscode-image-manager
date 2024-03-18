import { useUpdateEffect } from '@minko-fe/react-hook'
import { type DependencyList } from 'react'
import { type ConfigKey } from '~/core/config/common'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '../vscode-api'
import { useTrackState } from './useTrackState'

/**
 * @param key extension configuration 的 key
 */
export function useExtConfigState<T extends ConfigKey, U>(key: T, trackState: U, deps?: DependencyList) {
  const [state, setState] = useTrackState(trackState, deps)

  useUpdateEffect(() => {
    vscodeApi.postMessage({
      cmd: CmdToVscode.update_user_configuration,
      data: {
        key,
        value: state,
      },
    })
  }, [state])

  return [state, setState] as const
}
