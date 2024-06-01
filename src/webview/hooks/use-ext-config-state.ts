import { set } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { produce } from 'immer'
import { type DependencyList } from 'react'
import { type ConfigType } from '~/core/config/common'
import { CmdToVscode } from '~/message/cmd'
import VscodeContext from '../ui-framework/src/contexts/vscode-context'
import { vscodeApi } from '../vscode-api'
import { useTrackState } from './use-track-state'

/**
 * @param key extension configuration 的 key
 */
export function useExtConfigState<T extends Flatten<ConfigType>, U>(key: T, trackState: U, deps?: DependencyList) {
  const { setExtConfig } = VscodeContext.usePicker(['setExtConfig'])

  const onChangeBySet = useMemoizedFn(() => {
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
  })

  const [state, setState] = useTrackState(trackState, {
    deps,
    onChangeBySet,
  })

  return [state, setState] as const
}
