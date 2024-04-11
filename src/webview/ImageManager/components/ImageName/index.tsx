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

function ImageName(props: { children: string; image?: ImageType; showFullPath?: boolean }) {
  const { children, image, showFullPath } = props

  const suffixCount = last(children?.split('.'))?.length || -1
  const start = children.slice(0, children.length - suffixCount)
  const suffix = children.slice(-suffixCount).trim()

  const workspaceFolders = GlobalContext.useSelector((ctx) => ctx.imageState.workspaceFolders)

  const tooltipTitle = useMemoizedFn(() => {
    if (showFullPath && image) {
      const prefix = workspaceFolders.length > 1 ? `${image.workspaceFolder}/` : ''
      return `${prefix}${image.dirPath}/${image.name}`
    }
    return children
  })
  return (
    <div id='image-name'>
      <Tooltip {...tooltipProps} title={showFullPath ? tooltipTitle() : null}>
        <div>
          <Text
            style={{ maxWidth: '100%' }}
            ellipsis={{
              suffix,
              tooltip: showFullPath
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
