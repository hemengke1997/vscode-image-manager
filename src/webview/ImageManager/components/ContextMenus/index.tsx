import { memo } from 'react'
import CollapseContextMenu from './components/CollapseContextMenu'
import ImageContextMenu from './components/ImageContextMenu'
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
