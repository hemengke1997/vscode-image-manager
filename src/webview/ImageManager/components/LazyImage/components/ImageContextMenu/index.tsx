import { type ImageType } from '@rootSrc/webview/ImageManager'
import useImageOperation from '@rootSrc/webview/ImageManager/hooks/useImageOperation'
import { Keybinding } from '@rootSrc/webview/keybinding'
import GlobalContext from '@rootSrc/webview/ui-framework/src/contexts/GlobalContext'
import { App } from 'antd'
import { memo } from 'react'
import { Item, type ItemParams, Menu, RightSlot, Separator } from 'react-contexify'
import { useTranslation } from 'react-i18next'
import { os } from 'un-detector'

export const IMAGE_CONTEXT_MENU_ID = 'IMAGE_CONTEXT_MENU_ID'

function ImageContextMenu() {
  const { t } = useTranslation()
  const { theme } = GlobalContext.usePicker(['theme'])
  const { message } = App.useApp()

  const { copyImage, openInOsExplorer, openInVscodeExplorer, copyImageAsBase64, testVscodeBuiltInCmd } =
    useImageOperation()

  const handleCopy = (e: ItemParams<{ image: ImageType }>) => {
    copyImage(e.props?.image.path || '')
  }

  const handleCopyString = async (
    e: ItemParams<{ image: ImageType }>,
    type: 'name' | 'path',
    callback?: (s: string) => Promise<string | undefined>,
  ) => {
    const s = e.props?.image[type] || ''
    if (!s) {
      message.error(t('ia.copy_fail'))
      return
    }
    const res = await callback?.(s)
    navigator.clipboard.writeText(res || s)
    message.success(t('ia.copy_success'))
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

      <Item onClick={(e) => handleCopyString(e, 'name')}>{t('ia.copy_image_name')}</Item>
      <Item onClick={(e) => handleCopyString(e, 'path')}>{t('ia.copy_image_path')}</Item>

      <Item onClick={(e) => handleCopyString(e, 'path', copyImageAsBase64)}>{t('ia.copy_image_base64')}</Item>

      <Separator />
      <Item onClick={handleOpenInOsExplorer}>
        {os.isMac() ? t('ia.reveal_in_os_mac') : t('ia.reveal_in_os_windows')}
      </Item>
      <Item onClick={handleOpenInVscodeExplorer}>{t('ia.reveal_in_explorer')}</Item>
    </Menu>
  )
}

export default memo(ImageContextMenu)
