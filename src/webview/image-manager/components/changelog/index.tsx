import { lazy, memo } from 'react'
import { type GetProps } from 'antd'

const Renderer = lazy(() => import('./renderer'))

function ChangeLog(props: GetProps<typeof Renderer>) {
  return <Renderer {...props} />
}

export default memo(ChangeLog)
