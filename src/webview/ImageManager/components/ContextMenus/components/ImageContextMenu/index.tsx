import { useLockFn, useMemoizedFn } from '@minko-fe/react-hook'
import { App } from 'antd'
import { memo } from 'react'
import { type BooleanPredicate, Item, type ItemParams, Separator } from 'react-contexify'
import { useTranslation } from 'react-i18next'
import { os } from 'un-detector'
import { type ImageType } from '~/webview/ImageManager'
import useImageDetail from '~/webview/ImageManager/hooks/useImageDetail/useImageDetail'
import useImageOperation from '~/webview/ImageManager/hooks/useImageOperation'
import MaskMenu from '../../../MaskMenu'

export const IMAGE_CONTEXT_MENU_ID = 'IMAGE_CONTEXT_MENU_ID'

function ImageContextMenu() {
  const { t } = useTranslation()
  const { message } = App.useApp()

  const { openInOsExplorer, openInVscodeExplorer, copyImageAsBase64, beginCompressProcess, cropImage } =
    useImageOperation()

  const handleCopyString = useLockFn(
    async (
      e: ItemParams<{ image: ImageType }>,
      type: 'name' | 'path',
      callback?: (s: string) => Promise<string | undefined>,
    ) => {
      const s = e.props?.image[type] || ''
      if (!s) {
        message.error(t('im.copy_fail'))
        return
      }
      const res = await callback?.(s)
      navigator.clipboard.writeText(res || s)
      message.success(t('im.copy_success'))
    },
  )

  const handleOpenInOsExplorer = (e: ItemParams<{ image: ImageType }>) => {
    openInOsExplorer(e.props!.image.path)
  }

  const handleOpenInVscodeExplorer = (e: ItemParams<{ image: ImageType }>) => {
    openInVscodeExplorer(e.props!.image.path)
  }

  const _isOperationHidden = useMemoizedFn((e: ItemParams<{ operable: boolean }>) => {
    const { operable = true } = e.props || {}
    return !operable
  })
  const isOperationHidden = _isOperationHidden as BooleanPredicate

  const handleCompressImage = useMemoizedFn((e: ItemParams<{ image: ImageType }>) => {
    beginCompressProcess([e.props!.image])
  })

  const { showImageDetailModal } = useImageDetail()

  const handleCropImage = useLockFn(async (e: ItemParams<{ image: ImageType }>) => {
    if (!e.props?.image) {
      return message.error(t('im.no_image'))
    }
    cropImage(e.props.image)
  })

  return (
    <>
      <MaskMenu id={IMAGE_CONTEXT_MENU_ID}>
        <Item onClick={(e) => handleCopyString(e, 'name')}>{t('im.copy_image_name')}</Item>
        <Item onClick={(e) => handleCopyString(e, 'path')}>{t('im.copy_image_path')}</Item>
        <Item onClick={(e) => handleCopyString(e, 'path', copyImageAsBase64)}>{t('im.copy_image_base64')}</Item>
        <Separator />
        <Item onClick={handleOpenInOsExplorer}>
          {os.isMac() ? t('im.reveal_in_os_mac') : t('im.reveal_in_os_windows')}
        </Item>
        <Item onClick={handleOpenInVscodeExplorer}>{t('im.reveal_in_explorer')}</Item>
        <Separator hidden={isOperationHidden} />
        <Item
          // disabled={isCompressDisabled}
          hidden={isOperationHidden}
          onClick={handleCompressImage}
        >
          {t('im.compress')}
        </Item>
        <Item onClick={(e) => handleCropImage(e)} hidden={isOperationHidden}>
          {t('im.crop')}
        </Item>

        <Separator />
        <Item onClick={(e) => showImageDetailModal(e.props.image)}>{t('im.detail')}</Item>
      </MaskMenu>
    </>
  )
}

export default memo(ImageContextMenu)
