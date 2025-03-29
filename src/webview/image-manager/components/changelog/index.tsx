import { lazy, memo } from 'react'
import { type ChangelogProps } from './renderer'

const Renderer = lazy(() => import('./renderer'))

function ChangeLog(props: ChangelogProps) {
  return <Renderer {...props} />
}

export default memo(ChangeLog)
