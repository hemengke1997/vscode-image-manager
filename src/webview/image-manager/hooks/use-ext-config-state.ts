import { type DependencyList, useMemo } from 'react'
import { useDebounceFn, useMemoizedFn } from 'ahooks'
import { useTrackState } from 'ahooks-x'
import { type DebounceOptions } from 'ahooks/es/useDebounce/debounceOptions'
import { set } from 'es-toolkit/compat'
import { produce } from 'immer'
import { type ConfigType } from '~/core/config/common'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '../../vscode-api'
import VscodeStore from '../stores/vscode-store'

/**
 * 追踪插件配置中的某个配置
 * 配置状态始终与插件配置保持一致
 * 使用 setState 修改配置时，会自动debounce更新插件配置
 *
 * @param key extension configuration 的 key
 * @param trackedState 追踪的插件配置
 * @param deps 依赖项，当依赖项变化时，会重新获取插件配置
 */
export function useExtConfigState<T extends Flatten<ConfigType>, U>(
  key: T,
  trackedState: U,
  deps?: DependencyList,
  options?: {
    debounce?: DebounceOptions
    postValue?: (value: U) => U
  },
) {
  const postValue = options?.postValue || ((value) => value)
  const { setExtConfig } = VscodeStore.useStore(['setExtConfig'])

  const debounceOptions: DebounceOptions = useMemo(
    () => ({
      wait: 0,
      ...options?.debounce,
    }),
    [options?.debounce],
  )

  const { run: debounceUpdate } = useDebounceFn((state: U) => {
    vscodeApi.postMessage({
      cmd: CmdToVscode.update_user_configuration,
      data: {
        key,
        value: state,
      },
    })
  }, debounceOptions)

  const onChangeBySet = useMemoizedFn(() => {
    const value = postValue(state)
    setExtConfig(
      produce((draft) => {
        set(draft, key, value)
      }),
    )

    debounceUpdate(value)
  })

  const [state, setState] = useTrackState(trackedState, {
    deps,
    onChangeBySet,
  })

  return [state, setState] as const
}
