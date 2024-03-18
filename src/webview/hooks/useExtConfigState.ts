import { set } from '@minko-fe/lodash-pro'
import { useUpdateEffect } from '@minko-fe/react-hook'
import { produce } from 'immer'
import { type DependencyList } from 'react'
import { type ConfigKey } from '~/core/config/common'
import { CmdToVscode } from '~/message/cmd'
import VscodeContext from '../ui-framework/src/contexts/VscodeContext'
import { vscodeApi } from '../vscode-api'
import { Trigger, useTrackState } from './useTrackState'

/**
 * @param key extension configuration 的 key
 */
export function useExtConfigState<T extends ConfigKey, U>(key: T, trackState: U, deps?: DependencyList) {
  const { setExtConfig } = VscodeContext.usePicker(['setExtConfig'])

  const [state, setState, trigger] = useTrackState(trackState, deps)

  useUpdateEffect(() => {
    if (trigger === Trigger.track) return

    setExtConfig(
      produce((draft) => {
        set(draft, key, state)
      }),
    )
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
