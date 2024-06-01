import { last } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { Tooltip, type TooltipProps, Typography } from 'antd'
import { memo } from 'react'
import './index.css'

const { Text } = Typography

const tooltipProps: TooltipProps = {
  arrow: false,
  placement: 'bottom',
  destroyTooltipOnHide: true,
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
    if (tooltipDisplayFullPath && image) {
      return image.relativePath
    }
    return children
  })
  return (
    <div id='image-name'>
      <Tooltip {...tooltipProps} title={tooltipDisplayFullPath ? tooltipTitle() : null}>
        <div className={'select-text'}>
          <Text
            style={{ maxWidth: '100%' }}
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
        </div>
      </Tooltip>
    </div>
  )
}

export default memo(ImageName)
