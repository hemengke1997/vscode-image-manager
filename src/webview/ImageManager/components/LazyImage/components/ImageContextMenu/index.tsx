import { type ImageType } from '@root/webview/ImageManager'
import useImageOperation from '@root/webview/ImageManager/hooks/useImageOperation'
import { Keybinding } from '@root/webview/keybinding'
import GlobalContext from '@root/webview/ui-framework/src/contexts/GlobalContext'
import classNames from 'classnames'
import { memo } from 'react'
import { Item, type ItemParams, Menu, RightSlot } from 'react-contexify'
import { useTranslation } from 'react-i18next'
import './index.css'
import 'react-contexify/ReactContexify.css'

export const IMAGE_CONTEXT_MENU_ID = 'ImageContextMenu'

function ImageContextMenu() {
  const { t } = useTranslation()
  const theme = GlobalContext.useSelector((ctx) => ctx.appearance.theme)

  const { copyImage } = useImageOperation()

  const handleCopy = (e: ItemParams) => {
    copyImage((e.props.image as ImageType).path)
  }

  return (
    <Menu className={classNames('image-menu-context', 'text-xs')} id={IMAGE_CONTEXT_MENU_ID} theme={theme}>
      <Item
        onClick={(e) => {
          handleCopy(e)
        }}
      >
        {t('ia.copy')}
        <RightSlot>{Keybinding.Copy}</RightSlot>
      </Item>
      {/* <Item
        onClick={(e) => {
          handlePaste(e)
        }}
      >
        Paste
        <RightSlot>{Keybinding.Paste}</RightSlot>
      </Item> */}
      {/* <Separator /> */}

      {/* <Submenu label='Submenu'>
        <Item onClick={handleItemClick}>Sub Item 1</Item>
        <Item onClick={handleItemClick}>Sub Item 2</Item>
      </Submenu> */}
    </Menu>
  )
}

export default memo(ImageContextMenu)
