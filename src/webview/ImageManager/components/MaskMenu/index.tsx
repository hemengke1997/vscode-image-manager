import { memo, useState } from 'react'
import { Menu, type MenuProps } from 'react-contexify'
import FrameworkContext from '~/webview/ui-framework/src/contexts/FrameworkContext'

function MaskMenu(props: MenuProps) {
  const { theme } = FrameworkContext.usePicker(['theme'])

  const [contextMenuMask, setContextMenuMask] = useState(false)

  return (
    <>
      {contextMenuMask && <div className={'fixed inset-0 z-[999]'}></div>}
      <Menu
        {...props}
        theme={theme}
        onVisibilityChange={(v) => {
          props.onVisibilityChange?.(v)
          setContextMenuMask(v)
        }}
      ></Menu>
    </>
  )
}

export default memo(MaskMenu)
