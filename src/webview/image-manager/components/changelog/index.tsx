import { Suspense, lazy, memo } from 'react'
import { type ChangelogProps } from './renderer'

const Renderer = lazy(() => import('./renderer'))

function ChangeLog(props: ChangelogProps) {
  return (
    <Suspense fallback={null}>
      <Renderer {...props} />
    </Suspense>
  )
}

export default memo(ChangeLog)
