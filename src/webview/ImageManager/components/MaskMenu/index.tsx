import classNames from 'classnames'
import { memo, useState } from 'react'
import { Menu, type MenuProps } from 'react-contexify'
import styles from './index.module.css'

function MaskMenu(props: MenuProps) {
  const [contextMenuMask, setContextMenuMask] = useState(false)

  return (
    <>
      <div className={classNames(styles.mask, contextMenuMask && 'z-[999]')}></div>
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
