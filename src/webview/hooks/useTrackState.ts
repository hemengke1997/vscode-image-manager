import { isFunction } from '@minko-fe/lodash-pro'
import { useUpdateEffect } from '@minko-fe/react-hook'
import { type DependencyList, type Dispatch, type SetStateAction, useState } from 'react'

export enum Trigger {
  track = 'track',
  set = 'set',
}

/**
 * 追踪状态变化，当依赖变化后，重新获取状态
 * @param tracedState 被追踪的状态
 * @param deps 状态依赖
 */
export function useTrackState<S>(_trackState: S | (() => S), deps?: DependencyList) {
  const [trackState, setTrackState] = useState<{
    state: S
    trigger: 'track' | 'set'
  }>(() => {
    return {
      state: isFunction(_trackState) ? _trackState() : _trackState,
      trigger: 'track',
    }
  })
  const { state, trigger } = trackState

  useUpdateEffect(() => {
    setTrackState(
      isFunction(_trackState)
        ? () => ({
            state: _trackState(),
            trigger: Trigger.track,
          })
        : {
            state: _trackState,
            trigger: Trigger.track,
          },
    )
  }, [...(deps || []), _trackState])

  const setState: Dispatch<SetStateAction<S>> = (newState) => {
    if (isFunction(newState)) {
      setTrackState((t) => ({
        state: newState(t.state),
        trigger: Trigger.set,
      }))
    } else {
      setTrackState({
        state: newState,
        trigger: Trigger.set,
      })
    }
  }

  return [state, setState, trigger] as const
}
