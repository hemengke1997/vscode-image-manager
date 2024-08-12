import { set } from '@minko-fe/lodash-pro'
import { useDebounceFn, useMemoizedFn } from '@minko-fe/react-hook'
import { produce } from 'immer'
import { type DependencyList } from 'react'
import { type ConfigType } from '~/core/config/common'
import { CmdToVscode } from '~/message/cmd'
import VscodeContext from '../ui-framework/src/contexts/vscode-context'
import { vscodeApi } from '../vscode-api'
import { useTrackState } from './use-track-state'

/**
 * 追踪插件配置中的某个配置
 * 配置状态始终与插件配置保持一致
 * 使用 setState 修改配置时，会自动debounce更新插件配置
 *
 * @param key extension configuration 的 key
 * @param trackState 追踪的插件配置
 * @param deps 依赖项，当依赖项变化时，会重新获取插件配置
 */
export function useExtConfigState<T extends Flatten<ConfigType>, U>(key: T, trackState: U, deps?: DependencyList) {
  const { setExtConfig } = VscodeContext.usePicker(['setExtConfig'])

  const { run: debounceUpdate } = useDebounceFn(
    (state: U) => {
      vscodeApi.postMessage({
        cmd: CmdToVscode.update_user_configuration,
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
    setExtConfig(
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
