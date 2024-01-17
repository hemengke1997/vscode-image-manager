import classNames from 'classnames'
import { memo, useState } from 'react'
import CollapseContextMenu from '../ImageCollapse/components/CollapseContextMenu'
import ImageContextMenu from '../LazyImage/components/ImageContextMenu'
import './index.css'
import 'react-contexify/ReactContexify.css'

function ContextMenus() {
  const [contextMenuMask, setContextMenuMask] = useState(false)

  return (
    <>
      <div className={classNames('mask', contextMenuMask && 'z-[999]')}></div>
      <ImageContextMenu onVisibilityChange={setContextMenuMask} />
      <CollapseContextMenu onVisibilityChange={setContextMenuMask} />
    </>
  )
}

export default memo(ContextMenus)
