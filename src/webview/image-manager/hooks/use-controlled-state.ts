import { useMemoizedFn, usePrevious, useUpdate } from 'ahooks'
import { isFunction } from 'es-toolkit'
import { useEffect, useMemo, useRef } from 'react'

function useControlledState<T>(option: {
  defaultValue?: T | (() => T)
  value?: T
  onChange?: (value: T, prevValue: T) => void
  beforeValue?: (value: T, prevValue: T) => T | undefined
  postValue?: (value: T, prevValue: T) => T | undefined
  onInit?: (value: T) => void
}): [T, (value: T | ((prevState: T) => T)) => void, T] {
  const { defaultValue, value, onChange, beforeValue, postValue, onInit } = option

  const isControlled = Object.prototype.hasOwnProperty.call(option, 'value') && typeof value !== 'undefined'

  const initialValue = useMemo(() => {
    let init = value
    if (isControlled) {
      init = value
    }
    else if (defaultValue !== undefined) {
      init = isFunction(defaultValue) ? defaultValue() : defaultValue
    }
    return init
  }, [])

  useEffect(() => {
    onInit?.(initialValue as T)
  }, [initialValue])

  const stateRef = useRef(initialValue)

  if (isControlled) {
    stateRef.current = value
  }

  const previousState = usePrevious(stateRef.current) as T

  const update = useUpdate()

  function triggerChange(newValue: T | ((prevState: T) => T)) {
    let r = isFunction(newValue) ? newValue(stateRef.current as T) : newValue

    if (beforeValue) {
      const before = beforeValue(r, stateRef.current as T)
      if (before) {
        r = before
      }
    }

    if (onChange) {
      onChange(r, stateRef.current as T)
    }

    if (postValue) {
      const post = postValue(r, stateRef.current as T)
      if (post) {
        r = post
      }
    }

    if (!isControlled) {
      stateRef.current = r
      update()
    }
  }

  return [stateRef.current as T, useMemoizedFn(triggerChange), previousState as T]
}

export { useControlledState }
