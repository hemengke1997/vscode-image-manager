import { useUpdateEffect } from '@minko-fe/react-hook'
import { useState } from 'react'

export function useTrackConfigState<S>(config: S, defaultValue?: S) {
  const [state, setState] = useState<S>(defaultValue || config)

  useUpdateEffect(() => {
    setState(config)
  }, [config])

  return [state, setState] as const
}
