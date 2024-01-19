import { useLockFn } from '@minko-fe/react-hook'
import { App } from 'antd'
import { memo } from 'react'
import { Item, type ItemParams, Separator } from 'react-contexify'
import { useTranslation } from 'react-i18next'
import { os } from 'un-detector'
import { type ImageType } from '@/webview/ImageManager'
import useImageOperation from '@/webview/ImageManager/hooks/useImageOperation'
import FrameworkContext from '@/webview/ui-framework/src/contexts/FrameworkContext'
import MaskMenu from '../../../MaskMenu'

export const COLLAPSE_CONTEXT_MENU_ID = 'COLLAPSE_CONTEXT_MENU_ID'

function CollapseContextMenu() {
  const { theme } = FrameworkContext.usePicker(['theme'])
  const { t } = useTranslation()
  const { message } = App.useApp()

  const { openInOsExplorer, openInVscodeExplorer, compressImage, onCompressEnd } = useImageOperation()

  const handleOpenInOsExplorer = (e: ItemParams<{ targetPath: string }>) => {
    openInOsExplorer(e.props?.targetPath || '')
  }

  const handleOpenInVscodeExplorer = (e: ItemParams<{ targetPath: string }>) => {
    openInVscodeExplorer(e.props?.targetPath || '')
  }

  const handleCompressImage = useLockFn(async (images: ImageType[] | undefined) => {
    if (!images?.length) {
      message.info(t('im.no_image'))
      return
    }

    const LoadingKey = `${images[0].path}-compressing`

    message.loading({
      content: t('im.compressing'),
      duration: 0,
      key: LoadingKey,
    })
    try {
      const res = await compressImage(images.map((t) => t.path) || [])
      message.destroy(LoadingKey)
      if (Array.isArray(res)) {
        res.forEach((item) => {
          onCompressEnd(item, {
            onRetryClick: (filePath) => handleCompressImage([{ path: filePath }] as ImageType[]),
          })
        })
      }
    } catch (e) {
      message.destroy(LoadingKey)
      console.error(e)
    }
  })

  return (
    <>
      <MaskMenu id={COLLAPSE_CONTEXT_MENU_ID} theme={theme}>
        <Item
          onClick={(e: ItemParams<{ targetPath: string; images: ImageType[] }>) => handleCompressImage(e.props?.images)}
        >
          {t('im.compress_under_folder')}
        </Item>
        <Separator />
        <Item onClick={handleOpenInOsExplorer}>
          {os.isMac() ? t('im.reveal_in_os_mac') : t('im.reveal_in_os_windows')}
        </Item>
        <Item onClick={handleOpenInVscodeExplorer}>{t('im.reveal_in_explorer')}</Item>
      </MaskMenu>
    </>
  )
}

export default memo(CollapseContextMenu)
