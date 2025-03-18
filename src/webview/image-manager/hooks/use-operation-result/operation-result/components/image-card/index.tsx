import { memo, type PropsWithChildren } from 'react'
import { Card, type GetProps } from 'antd'
import { classNames } from 'tw-clsx'
import GlobalStore from '~/webview/image-manager/stores/global-store'
import styles from './index.module.css'

function ImageCard(props: PropsWithChildren<GetProps<typeof Card>>) {
  const { imageWidth } = GlobalStore.useStore(['imageWidth'])
  const { children, ...rest } = props
  return (
    <Card {...rest} className={classNames('w-fit', styles.card)} style={{ width: imageWidth + 16 }}>
      {children}
    </Card>
  )
}

export default memo(ImageCard)
