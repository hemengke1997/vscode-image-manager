import { isFunction } from '@minko-fe/lodash-pro'
import { useUpdateEffect } from '@minko-fe/react-hook'
import { type DependencyList, useState } from 'react'

/**
 * 追踪状态变化，当依赖变化后，重新获取状态
 * @param tracedState 被追踪的状态
 * @param deps 状态依赖
 */
export function useTrackState<S>(tracedState: S | (() => S), deps?: DependencyList) {
  const [state, setState] = useState<S>(tracedState)

  useUpdateEffect(() => {
    setState(isFunction(tracedState) ? () => tracedState() : tracedState)
  }, [...(deps || []), tracedState])

  return [state, setState] as const
}
