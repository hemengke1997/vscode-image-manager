import { Collapse, type CollapseProps } from 'antd'
import { memo, useEffect, useState } from 'react'
import ImageAnalysorContext from '../../contexts/ImageAnalysorContext'
import ImagePreview, { type ImagePreviewProps } from '../ImagePreview'

type ImageCollapseProps = {
  collapseProps: CollapseProps
  group: ImagePreviewProps['group']
  nestedChildren: JSX.Element | null
}

function ImageCollapse(props: ImageCollapseProps) {
  const { collapseProps, nestedChildren, group } = props

  const { collapseOpen } = ImageAnalysorContext.usePicker(['collapseOpen'])

  const [activeKeys, setActiveKeys] = useState<string[]>([])

  const onCollapseChange = (keys: string[]) => {
    setActiveKeys(keys)
  }

  useEffect(() => {
    if (collapseOpen > 0) {
      setActiveKeys([group.label])
    } else {
      setActiveKeys([])
    }
  }, [collapseOpen])

  if (!group.children.length) return null

  return (
    <Collapse
      destroyInactivePanel={false}
      {...collapseProps}
      activeKey={activeKeys}
      onChange={(keys) => onCollapseChange(keys as string[])}
      items={[
        {
          key: group.label,
          label: group.label,
          children: nestedChildren || <ImagePreview group={group} />,
        },
      ]}
    ></Collapse>
  )
}

export default memo(ImageCollapse)
