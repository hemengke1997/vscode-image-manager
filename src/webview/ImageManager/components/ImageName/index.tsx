import { last } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { Tooltip, type TooltipProps, Typography } from 'antd'
import { memo } from 'react'
import GlobalContext from '../../contexts/GlobalContext'
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

  const workspaceFolders = GlobalContext.useSelector((ctx) => ctx.imageState.workspaceFolders)

  const tooltipTitle = useMemoizedFn(() => {
    if (tooltipDisplayFullPath && image) {
      const prefix = workspaceFolders.length > 1 ? `${image.workspaceFolder}/` : ''
      return `${prefix}${image.dirPath}/${image.name}`
    }
    return children
  })
  return (
    <div id='image-name'>
      <Tooltip {...tooltipProps} title={tooltipDisplayFullPath ? tooltipTitle() : null}>
        <div>
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
