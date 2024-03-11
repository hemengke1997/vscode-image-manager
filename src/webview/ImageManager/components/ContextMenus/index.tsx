import { memo } from 'react'
import CollapseContextMenu from './components/CollapseContextMenu'
import ImageContextMenu from './components/ImageContextMenu'
import 'react-contexify/ReactContexify.css'
import './index.css'

function ContextMenus() {
  return (
    <>
      <ImageContextMenu />
      <CollapseContextMenu />
    </>
  )
}

export default memo(ContextMenus)
