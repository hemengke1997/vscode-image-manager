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
        data-id='context-menu-mask'
      ></div>
      <Menu
        {...props}
        theme={theme}
        onVisibilityChange={(v) => {
          if (v) {
            // menu先展示，再展示mask，避免menu消失
            setTimeout(() => {
              setContextMenuMask(v)
            }, 60)
          } else {
            setContextMenuMask(v)
          }
          props.onVisibilityChange?.(v)
        }}
      ></Menu>
    </>
  )
}

export default memo(MaskMenu)
