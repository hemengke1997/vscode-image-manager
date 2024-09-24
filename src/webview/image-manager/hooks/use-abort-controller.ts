import { useEffect, useRef } from 'react'
import { useMemoizedFn } from 'ahooks'

export default function useAbortController() {
  const controller = useRef(new AbortController())

  useEffect(() => {
    return () => {
      controller.current.abort()
    }
  }, [])

  const abort = useMemoizedFn(() => {
    controller.current.abort()
    controller.current = new AbortController()
  })

  return {
    signal: controller.current.signal,
    abort,
  }
}
