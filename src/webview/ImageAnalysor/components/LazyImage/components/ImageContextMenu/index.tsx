import GlobalContext from '@root/webview/ui-framework/src/contexts/GlobalContext'
import { memo } from 'react'
import { Item, type ItemParams, Menu, Separator, Submenu } from 'react-contexify'
import 'react-contexify/ReactContexify.css'
import styles from './index.module.css'

export const IMAGE_CONTEXT_MENU_ID = 'ImageContextMenu'

function ImageContextMenu() {
  const theme = GlobalContext.useSelector((ctx) => ctx.appearance.theme)

  function handleItemClick({ event, props, triggerEvent, data }: ItemParams) {
    console.log(event, props, triggerEvent, data)
  }

  return (
    <Menu className={styles.contextify} id={IMAGE_CONTEXT_MENU_ID} theme={theme}>
      <Item onClick={handleItemClick} closeOnClick={false}>
        Item 1
      </Item>
      <Item onClick={handleItemClick}>Item 2</Item>
      <Separator />
      <Item disabled>Disabled</Item>
      <Separator />
      <Submenu label='Submenu'>
        <Item onClick={handleItemClick}>Sub Item 1</Item>
        <Item onClick={handleItemClick}>Sub Item 2</Item>
      </Submenu>
    </Menu>
  )
}

export default memo(ImageContextMenu)
