import type { DependencyList, Dispatch, SetStateAction } from 'react'
import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { isFunction } from 'es-toolkit'
import { useState } from 'react'

export enum Trigger {
  track = 'track',
  set = 'set',
}

/**
 * 追踪依赖状态变化，当依赖变化后，重新获取状态
 * @param trackState 被追踪的状态
 * @param options
 * @param options.deps 依赖
 * @param options.onChangeBySet 通过 setState 改变状态时的回调
 * @param options.defaultValue 默认值
 * @param options.onChangeByTrack 通过追踪状态改变时的回调
 *
 * @returns [state, setState, trigger]
 */
export function useTrackState<S>(
  trackState: S | (() => S),
  options?: {
    deps?: DependencyList
    defaultValue?: S | (() => S)
    onChangeBySet?: (state: S) => void
    onChangeByTrack?: (state: S) => void
  },
) {
  const { deps, defaultValue, onChangeBySet, onChangeByTrack } = options || {}

  const execIfFn = (fn: S | (() => S) | undefined) => (isFunction(fn) ? fn() : fn)

  const [trackedState, setTrackState] = useState<{
    state: S
    trigger: 'track' | 'set'
  }>(() => {
    const value = execIfFn(trackState) || execIfFn(defaultValue)
    return {
      state: value!,
      trigger: 'track',
    }
  })

  const { state, trigger } = trackedState

  useUpdateEffect(() => {
    setTrackState(
      isFunction(trackState)
        ? () => ({
            state: trackState(),
            trigger: Trigger.track,
          })
        : {
            state: trackState,
            trigger: Trigger.track,
          },
    )
  }, [...(deps || []), ...(isFunction(trackState) ? [] : [trackState])])

  const setState: Dispatch<SetStateAction<S>> = useMemoizedFn((newState) => {
    if (isFunction(newState)) {
      setTrackState(t => ({
        state: newState(t.state),
        trigger: Trigger.set,
      }))
    }
    else {
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
      }
    }
  }, [state])

  return [state, setState, trigger] as const
}
