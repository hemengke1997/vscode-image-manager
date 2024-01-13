import { memo } from 'react'
import CollapseContextMenu from '../ImageCollapse/components/CollapseContextMenu'
import ImageContextMenu from '../LazyImage/components/ImageContextMenu'

function ContextMenus() {
  return (
    <>
      <ImageContextMenu />
      <CollapseContextMenu />
    </>
  )
}

export default memo(ContextMenus)
