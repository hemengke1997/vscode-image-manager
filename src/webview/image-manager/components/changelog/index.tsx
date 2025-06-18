import type { GetProps } from 'antd'
import { lazy, memo } from 'react'

const Renderer = lazy(() => import('./renderer'))

function ChangeLog(props: GetProps<typeof Renderer>) {
  return <Renderer {...props} />
}

export default memo(ChangeLog)
