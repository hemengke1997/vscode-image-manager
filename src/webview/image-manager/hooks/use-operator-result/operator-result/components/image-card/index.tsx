import { Card, type GetProps } from 'antd'
import { memo, type PropsWithChildren } from 'react'
import { classNames } from 'tw-clsx'
import { type OperatorResult } from '~/core'
import ImagePreview from '~/webview/image-manager/components/image-preview'
import GlobalContext from '~/webview/image-manager/contexts/global-context'
import styles from './index.module.css'

function ImageCard(props: PropsWithChildren<{ item: OperatorResult; root: HTMLElement } & GetProps<typeof Card>>) {
  const { imageWidth } = GlobalContext.usePicker(['imageWidth'])
  const { item, root, children, ...rest } = props
  return (
    <Card
      {...rest}
      className={classNames('w-fit', styles.card)}
      style={{ width: imageWidth + 16 }}
      cover={
        <ImagePreview
          images={[item.image]}
          lazyImageProps={{
            contextMenu: {},
            imageNameProps: {
              tooltipDisplayFullPath: true,
            },
            lazy: {
              root,
            },
            interactive: false,
          }}
        ></ImagePreview>
      }
    >
      {children}
    </Card>
  )
}

export default memo(ImageCard)
