import { memo, useState } from 'react'
import { Menu, type MenuProps } from 'react-contexify'
import { classNames } from 'tw-clsx'
import SettingsContext from '../../contexts/settings-context'

function MaskMenu(props: MenuProps) {
  const { theme } = SettingsContext.usePicker(['theme'])

  const [contextMenuMask, setContextMenuMask] = useState(false)

  return (
    <>
      <div
        className={classNames('fixed inset-0 z-[999]', contextMenuMask ? 'block' : 'hidden')}
        id='context-menu-mask'
      ></div>
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
