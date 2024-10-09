import { type DependencyList, type Dispatch, type SetStateAction, useState } from 'react'
import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { isFunction } from 'lodash-es'

export const enum Trigger {
  track = 'track',
  set = 'set',
}

/**
 * 追踪依赖状态变化，当依赖变化后，重新获取状态
 * @param tracedState 被追踪的状态
 * @param options
 * deps: 依赖
 * onChangeBySet: 通过 setState 改变状态时的回调
 * onChangeByTrack: 通过追踪状态改变时的回调
 *
 * @returns [state, setState, trigger]
 */
export function useTrackState<S>(
  _trackState: S | (() => S),
  options?: {
    deps?: DependencyList
    defaultValue?: S | (() => S)
    onChangeBySet?: (state: S) => void
    onChangeByTrack?: (state: S) => void
  },
) {
  const { deps, defaultValue, onChangeBySet, onChangeByTrack } = options || {}

  const [trackState, setTrackState] = useState<{
    state: S
    trigger: 'track' | 'set'
  }>(() => {
    const value = defaultValue || _trackState
    return {
      state: isFunction(value) ? value() : value,
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
  }, [...(deps || []), ...(isFunction(_trackState) ? [] : [_trackState])])

  const setState: Dispatch<SetStateAction<S>> = useMemoizedFn((newState) => {
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
  })

  useUpdateEffect(() => {
    switch (trigger) {
      case Trigger.track: {
        onChangeByTrack?.(state)
        return
      }
      case Trigger.set: {
        onChangeBySet?.(state)
        return
      }
      default:
        break
    }
  }, [state])

  return [state, setState, trigger] as const
}
