import { type ImageType } from '@rootSrc/webview/ImageManager'
import useImageOperation from '@rootSrc/webview/ImageManager/hooks/useImageOperation'
import { Keybinding } from '@rootSrc/webview/keybinding'
import GlobalContext from '@rootSrc/webview/ui-framework/src/contexts/GlobalContext'
import { memo } from 'react'
import { Item, type ItemParams, Menu, RightSlot, Separator } from 'react-contexify'
import { useTranslation } from 'react-i18next'
import { os } from 'un-detector'

export const IMAGE_CONTEXT_MENU_ID = 'IMAGE_CONTEXT_MENU_ID'

function ImageContextMenu() {
  const { t } = useTranslation()
  const { theme } = GlobalContext.usePicker(['theme'])

  const { copyImage, openInOsExplorer, openInVscodeExplorer, testVscodeBuiltInCmd } = useImageOperation()

  const handleCopy = (e: ItemParams<{ image: ImageType }>) => {
    copyImage(e.props?.image.path || '')
  }

  const handleOpenInOsExplorer = (e: ItemParams<{ image: ImageType }>) => {
    openInOsExplorer(e.props?.image.path || '')
  }

  const handleOpenInVscodeExplorer = (e: ItemParams<{ image: ImageType }>) => {
    openInVscodeExplorer(e.props?.image.path || '')
  }

  const _test = (e: ItemParams<{ image: ImageType }>) => {
    testVscodeBuiltInCmd({
      cmd: 'revealFileInOS',
      path: e.props?.image.path || '',
    })
  }

  return (
    <Menu id={IMAGE_CONTEXT_MENU_ID} theme={theme}>
      <Item onClick={handleCopy}>
        {t('ia.copy')}
        <RightSlot>{Keybinding.Copy}</RightSlot>
      </Item>
      <Separator />
      <Item onClick={handleOpenInOsExplorer}>
        {os.isMac() ? t('ia.reveal_in_os_mac') : t('ia.reveal_in_os_windows')}
      </Item>
      <Item onClick={handleOpenInVscodeExplorer}>{t('ia.reveal_in_explorer')}</Item>
    </Menu>
  )
}

export default memo(ImageContextMenu)
