import { isFunction } from '@minko-fe/lodash-pro'
import { useUpdateEffect } from '@minko-fe/react-hook'
import { type DependencyList, useState } from 'react'

export function useTrackConfigState<S>(config: S | (() => S), deps?: DependencyList) {
  const [state, setState] = useState<S>(config)

  useUpdateEffect(() => {
    setState(isFunction(config) ? () => config() : config)
  }, [...(deps || []), config])

  return [state, setState] as const
}
