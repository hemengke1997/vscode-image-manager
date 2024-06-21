import { memo, useState } from 'react'
import { Menu, type MenuProps } from 'react-contexify'
import { classnames } from 'tw-clsx'
import GlobalContext from '../../contexts/global-context'

function MaskMenu(props: MenuProps) {
  const { theme } = GlobalContext.usePicker(['theme'])

  const [contextMenuMask, setContextMenuMask] = useState(false)

  return (
    <>
      <div className={classnames('fixed inset-0 z-[999]', contextMenuMask ? 'block' : 'hidden')}></div>
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
