import type { GetProps } from 'antd'
import type { PropsWithChildren } from 'react'
import { Card } from 'antd'
import { memo } from 'react'
import { useImageWidth } from '~/webview/image-manager/stores/global/hooks'
import { classNames } from '~/webview/image-manager/utils/tw-clsx'
import styles from './index.module.css'

function ImageCard(props: PropsWithChildren<GetProps<typeof Card>>) {
  const [imageWidth] = useImageWidth()
  const { children, ...rest } = props
  return (
    <Card {...rest} className={classNames('w-fit', styles.card)} style={{ width: imageWidth + 16 }}>
      {children}
    </Card>
  )
}

export default memo(ImageCard)
