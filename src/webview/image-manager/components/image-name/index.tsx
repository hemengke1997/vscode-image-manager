import type { TooltipProps } from 'antd'
import { useMemoizedFn } from 'ahooks'
import { Tooltip } from 'antd'
import { memo } from 'react'

const tooltipProps: TooltipProps = {
  arrow: false,
  placement: 'bottom',
  destroyOnHidden: true,
  align: {
    offset: [0, 8],
  },
}

type Props = {
  children?: string
  image?: ImageType
  /**
   * 是否显示完整路径
   */
  tooltipDisplayFullPath?: boolean
}

function ImageName(props: Props) {
  const { children, image, tooltipDisplayFullPath } = props

  const tooltipTitle = useMemoizedFn(() => {
    let title = ''
    if (tooltipDisplayFullPath && image) {
      title = image.relativePath.slice(2)
    }
    else {
      title = children || ''
    }
    return <div data-disable_dbclick>{title}</div>
  })

  return tooltipDisplayFullPath
    ? (
        <Tooltip {...tooltipProps} title={tooltipTitle()}>
          {children}
        </Tooltip>
      )
    : (
        <span title={children} className='w-full'>
          {children}
        </span>
      )
}

export default memo(ImageName)
