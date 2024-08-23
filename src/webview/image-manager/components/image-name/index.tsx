import { useMemoizedFn } from 'ahooks'
import { Tooltip, type TooltipProps } from 'antd'
import { memo } from 'react'

const tooltipProps: TooltipProps = {
  arrow: false,
  placement: 'bottom',
  destroyTooltipOnHide: true,
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

  const tooltipTitle = useMemoizedFn(() => {
    let title = ''
    if (tooltipDisplayFullPath && image) {
      title = image.relativePath
    }
    title = children || ''
    return <div data-disable_dbclick>{title}</div>
  })

  return tooltipDisplayFullPath ? (
    <Tooltip {...tooltipProps} title={tooltipTitle()}>
      {children}
    </Tooltip>
  ) : (
    <span title={children} className={'w-full'}>
      {children}
    </span>
  )
}

export default memo(ImageName)
