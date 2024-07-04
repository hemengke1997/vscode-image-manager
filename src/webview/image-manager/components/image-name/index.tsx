import { last } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { Tooltip, type TooltipProps, Typography } from 'antd'
import { memo } from 'react'
import styles from './index.module.css'

const { Text } = Typography

const tooltipProps: TooltipProps = {
  arrow: false,
  placement: 'bottom',
  destroyTooltipOnHide: false,
  align: {
    offset: [0, 8],
  },
}

export type ImageNameProps = {
  children?: string
  image?: ImageType
  tooltipDisplayFullPath?: boolean
}

function ImageName(props: ImageNameProps) {
  const { children, image, tooltipDisplayFullPath } = props

  const suffixCount = last(children?.split('.'))?.length || -1
  const start = children?.slice(0, children.length - suffixCount)
  const suffix = children?.slice(-suffixCount).trim()

  const tooltipTitle = useMemoizedFn(() => {
    let title = ''
    if (tooltipDisplayFullPath && image) {
      title = image.relativePath
    }
    title = children || ''
    return <div data-disable-dbclick>{title}</div>
  })

  return (
    <div id={styles.imageName}>
      <Tooltip {...tooltipProps} title={tooltipDisplayFullPath ? tooltipTitle() : ''}>
        <Text
          className={'max-w-full'}
          ellipsis={{
            suffix,
            tooltip: tooltipDisplayFullPath
              ? false
              : {
                  ...tooltipProps,
                  title: tooltipTitle(),
                },
          }}
        >
          {start}
        </Text>
      </Tooltip>
    </div>
  )
}

export default memo(ImageName)
