import type { DebounceOptions } from 'ahooks/es/useDebounce/debounceOptions'
import type { ConfigType } from '~/core/config/common'
import { useDebounceFn, useMemoizedFn } from 'ahooks'
import { set } from 'es-toolkit/compat'
import { produce } from 'immer'
import { useSetAtom } from 'jotai'
import { type DependencyList, useMemo } from 'react'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '../../vscode-api'
import { VscodeAtoms } from '../stores/vscode/vscode-store'
import { useTrackState } from './use-track-state'

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
  const postValue = useMemoizedFn(options?.postValue || (value => value))
  const setExtConfig = useSetAtom(VscodeAtoms.extConfigAtom)

  const debounceOptions: DebounceOptions = useMemo(
    () => ({
      wait: 0,
      ...options?.debounce,
    }),
    [options?.debounce],
  )

  const { run: debounceUpdate } = useDebounceFn((state: U, value: U) => {
    // webview中的状态不跟postValue走，直接更新
    // 避免循环更新
    setExtConfig(
      produce((draft) => {
        set(draft!, key, state)
      }),
    )

    vscodeApi.postMessage({
      cmd: CmdToVscode.update_user_configuration,
      data: {
        key,
        value,
      },
    })
  }, debounceOptions)

  const onChangeBySet = useMemoizedFn((state: U) => {
    const value = postValue(state)
    debounceUpdate(state, value)
  })

  const [state, setState] = useTrackState(trackedState, {
    deps,
    onChangeBySet,
  })

  return [state, setState] as const
}
