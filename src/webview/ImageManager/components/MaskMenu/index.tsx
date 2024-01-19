import { memo, useState } from 'react'
import { Menu, type MenuProps } from 'react-contexify'

function MaskMenu(props: MenuProps) {
  const [contextMenuMask, setContextMenuMask] = useState(false)

  return (
    <>
      {contextMenuMask && <div className={'fixed inset-0 z-[999]'}></div>}
      <Menu
        {...props}
        onVisibilityChange={(v) => {
          props.onVisibilityChange?.(v)
          setContextMenuMask(v)
        }}
      ></Menu>
    </>
  )
}

export default memo(MaskMenu)
