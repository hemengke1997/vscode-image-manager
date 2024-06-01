import { memo } from 'react'
import CollapseContextMenu from './components/collapse-context-menu'
import ImageContextMenu from './components/image-context-menu'
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
