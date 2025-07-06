import type { ReactNode } from 'react'
import { Empty } from 'antd'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  render?: (description: string) => ReactNode
}

function EmptyImage(props: Props) {
  const { render } = props
  const { t } = useTranslation()
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={render?.(t('im.no_image')) || t('im.no_image')} />
}

export default memo(EmptyImage)
