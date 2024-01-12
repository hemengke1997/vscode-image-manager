import { useLockFn } from '@minko-fe/react-hook'
import { type ImageType } from '@rootSrc/webview/ImageManager'
import ImageManagerContext from '@rootSrc/webview/ImageManager/contexts/ImageManagerContext'
import useImageOperation from '@rootSrc/webview/ImageManager/hooks/useImageOperation'
import GlobalContext from '@rootSrc/webview/ui-framework/src/contexts/GlobalContext'
import { App } from 'antd'
import { memo } from 'react'
import { type BooleanPredicate, Item, type ItemParams, Menu, Separator } from 'react-contexify'
import { useTranslation } from 'react-i18next'
import { os } from 'un-detector'

export const IMAGE_CONTEXT_MENU_ID = 'IMAGE_CONTEXT_MENU_ID'

function ImageContextMenu() {
  const { t } = useTranslation()
  const { theme } = GlobalContext.usePicker(['theme'])
  const { message } = App.useApp()

  const {
    openInOsExplorer,
    openInVscodeExplorer,
    copyImageAsBase64,
    compressImage,
    onCompressEnd,
    _testVscodeBuiltInCmd,
  } = useImageOperation()

  const handleCopyString = useLockFn(
    async (
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
    },
  )

  const handleOpenInOsExplorer = (e: ItemParams<{ image: ImageType }>) => {
    openInOsExplorer(e.props!.image.path)
  }

  const handleOpenInVscodeExplorer = (e: ItemParams<{ image: ImageType }>) => {
    openInVscodeExplorer(e.props!.image.path)
  }

  const { compressor } = ImageManagerContext.usePicker(['compressor'])
  const isCompressDisabled = (e: ItemParams<{ image: ImageType }>) => {
    const supportedExts = compressor?.config.exts
    if (supportedExts?.includes(e.props?.image.extraPathInfo.ext || '')) {
      return false
    }
    return true
  }

  const handleCompressImage = useLockFn(async (filePath: string) => {
    const LoadingKey = `${filePath}-compressing`
    message.loading({
      content: t('ia.compressing'),
      duration: 10,
      key: LoadingKey,
    })
    const res = await compressImage([filePath])
    message.destroy(LoadingKey)

    if (Array.isArray(res)) {
      res.forEach((item) => {
        onCompressEnd(item, {
          onRetryClick: (filePath) => {
            handleCompressImage(filePath)
          },
        })
      })
    }
  })

  const _test = (e: ItemParams<{ image: ImageType }>) => {
    _testVscodeBuiltInCmd({
      cmd: 'revealFileInOS',
      path: e.props?.image.path || '',
    })
  }

  return (
    <Menu id={IMAGE_CONTEXT_MENU_ID} theme={theme}>
      <Item onClick={(e) => handleCopyString(e, 'name')}>{t('ia.copy_image_name')}</Item>
      <Item onClick={(e) => handleCopyString(e, 'path')}>{t('ia.copy_image_path')}</Item>
      <Item onClick={(e) => handleCopyString(e, 'path', copyImageAsBase64)}>{t('ia.copy_image_base64')}</Item>
      <Separator />
      <Item
        disabled={isCompressDisabled as BooleanPredicate}
        onClick={(e: ItemParams<{ image: ImageType }>) => handleCompressImage(e.props!.image.path)}
      >
        {t('ia.compress')}
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
