import { memo } from 'react'
import 'react-contexify/ReactContexify.css'
import CollapseContextMenu from './components/collapse-context-menu'
import ImageContextMenu from './components/image-context-menu'
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
