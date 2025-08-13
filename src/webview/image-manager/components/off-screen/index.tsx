import type { ReactNode } from 'react'
import { useIsomorphicLayoutEffect, useMemoizedFn } from 'ahooks'
import { Suspense, useRef } from 'react'

type OffScreenInProps = {
  mode: 'visible' | 'hidden'
  children: ReactNode
}

export default function OffScreen(props: OffScreenInProps & {
  fallback: ReactNode
}) {
  const { fallback } = props

  return (
    <Suspense fallback={fallback}>
      <OffScreenIn {...props} />
    </Suspense>
  )
}

function OffScreenIn(props: OffScreenInProps) {
  const { mode, children } = props

  const promiseRef = useRef<Promise<void> | null>(null)
  const resolveRef = useRef<(() => void) | null>(null)
  const resolvePromise = useMemoizedFn((ignoreMode?: boolean) => {
    if ((ignoreMode || mode === 'visible') && typeof resolveRef.current === 'function') {
      resolveRef.current()
      resolveRef.current = null
      promiseRef.current = null
    }
  })

  useIsomorphicLayoutEffect(() => () => resolvePromise(true), [])

  if (mode === 'hidden') {
    if (resolveRef.current === null) {
      promiseRef.current = new Promise<void>(resolve => (resolveRef.current = resolve))
    }

    const promise = promiseRef.current!
    throw promise
  }

  resolvePromise()

  return children
}
