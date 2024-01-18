import { memo } from 'react'
import CollapseContextMenu from '../ImageCollapse/components/CollapseContextMenu'
import ImageContextMenu from '../LazyImage/components/ImageContextMenu'
import './index.css'
import 'react-contexify/ReactContexify.css'

function ContextMenus() {
  return (
    <>
      <ImageContextMenu />
      <CollapseContextMenu />
    </>
  )
}

export default memo(ContextMenus)
