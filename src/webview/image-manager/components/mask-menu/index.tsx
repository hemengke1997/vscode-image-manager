import { memo, useState } from 'react'
import { Menu, type MenuProps } from 'react-contexify'
import { classNames } from '~/webview/image-manager/utils/tw-clsx'
import { useTheme } from '../../stores/settings/hooks'
import { PreventClickAway, ShouldClickAway } from '../viewer/hooks/use-click-image-away'

function MaskMenu(props: MenuProps) {
  const [theme] = useTheme()

  const [contextMenuMask, setContextMenuMask] = useState(false)

  return (
    <>
      <div
        className={classNames(
          'fixed inset-0 z-[9999]',
          contextMenuMask ? 'block' : 'hidden',
          ShouldClickAway.Other,
          PreventClickAway.Viewer,
        )}
      >
      </div>
      <Menu
        {...props}
        theme={theme}
        onVisibilityChange={(v) => {
          if (v) {
            // menu先展示，再展示mask，避免menu消失
            // 有时候会出现右键后，菜单闪烁马上消失的情况
            // 通过setTimeout解决
            setTimeout(() => {
              Promise.resolve().then(() => {
                setContextMenuMask(v)
              })
            })
          }
          else {
            setContextMenuMask(v)
          }
          props.onVisibilityChange?.(v)
        }}
      >
      </Menu>
    </>
  )
}

export default memo(MaskMenu)
