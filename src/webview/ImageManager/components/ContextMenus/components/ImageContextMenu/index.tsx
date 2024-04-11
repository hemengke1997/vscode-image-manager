import { useLockFn, useMemoizedFn } from '@minko-fe/react-hook'
import { App } from 'antd'
import { memo } from 'react'
import { type BooleanPredicate, Item, type ItemParams, RightSlot, Separator, Submenu } from 'react-contexify'
import { useTranslation } from 'react-i18next'
import { os } from 'un-detector'
import logger from '~/utils/logger'
import useImageDetail from '~/webview/ImageManager/hooks/useImageDetail/useImageDetail'
import useImageOperation from '~/webview/ImageManager/hooks/useImageOperation'
import { Keybinding } from '~/webview/ImageManager/keybinding'
import MaskMenu from '../../../MaskMenu'
import Arrow from '../Arrow'

export const IMAGE_CONTEXT_MENU_ID = 'IMAGE_CONTEXT_MENU_ID'

function ImageContextMenu() {
  const { t } = useTranslation()
  const { message } = App.useApp()

  const {
    openInOsExplorer,
    openInVscodeExplorer,
    copyImageAsBase64,
    beginCompressProcess,
    cropImage,
    beginFormatConversionProcess,
    prettySvg,
    beginFindSimilarProcess,
    beginDeleteProcess,
    beginRenameProcess,
  } = useImageOperation()

  // 复制图片 name | path | base64
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

  // 在os中打开图片
  const handleOpenInOsExplorer = (e: ItemParams<{ image: ImageType }>) => {
    openInOsExplorer(e.props!.image.path)
  }

  // 在vscode中打开图片
  const handleOpenInVscodeExplorer = (e: ItemParams<{ image: ImageType }>) => {
    openInVscodeExplorer(e.props!.image.path)
  }

  // 是否禁用操作
  const _isOperationHidden = useMemoizedFn((e: ItemParams<{ operable: boolean }>) => {
    const { operable = true } = e.props || {}
    return !operable
  })
  const isOperationHidden = _isOperationHidden as BooleanPredicate

  // 压缩图片
  const handleCompressImage = useMemoizedFn((e: ItemParams<{ image: ImageType }>) => {
    beginCompressProcess([e.props!.image])
  })

  // 裁剪图片
  const handleCropImage = useLockFn(async (e: ItemParams<{ image: ImageType }>) => {
    if (!e.props?.image) {
      return message.error(t('im.no_image'))
    }
    cropImage(e.props.image)
  })

  // 转化格式
  const handleConvertFormat = useLockFn(async (e: ItemParams<{ image: ImageType }>) => {
    beginFormatConversionProcess([e.props!.image])
  })

  // 格式化svg
  const handlePrettySvg = useLockFn(async (e: ItemParams<{ image: ImageType }>) => {
    try {
      const { image } = e.props!
      await prettySvg(image.path)
      message.success(t('im.pretty_success'))
    } catch (e) {
      logger.error(e)
    }
  })

  const handleFindSimilar = useMemoizedFn(async (image: ImageType, images: ImageType[]) => {
    beginFindSimilarProcess(image, images)
  })
  const handleFindSimilarInSameLevel = useLockFn(
    async (e: ItemParams<{ image: ImageType; sameLevelImages: ImageType[] }>) => {
      const { image, sameLevelImages } = e.props || {}
      await handleFindSimilar(image!, sameLevelImages!)
    },
  )
  const handleFindSimilarInAll = useLockFn(
    async (e: ItemParams<{ image: ImageType; sameWorkspaceImages: ImageType[] }>) => {
      const { image, sameWorkspaceImages } = e.props || {}
      await handleFindSimilar(image!, sameWorkspaceImages!)
    },
  )

  const handleDelete = useMemoizedFn((e: ItemParams<{ image: ImageType }>) => {
    beginDeleteProcess(e.props!.image)
  })

  const handleRename = useMemoizedFn((e: ItemParams<{ image: ImageType; sameDirImages: ImageType[] }>) => {
    beginRenameProcess(e.props!.image, e.props!.sameDirImages)
  })

  const { showImageDetailModal } = useImageDetail()

  return (
    <>
      <MaskMenu id={IMAGE_CONTEXT_MENU_ID}>
        <Item onClick={handleOpenInOsExplorer}>
          {os.isMac() ? t('im.reveal_in_os_mac') : t('im.reveal_in_os_windows')}
        </Item>
        <Item onClick={handleOpenInVscodeExplorer}>{t('im.reveal_in_explorer')}</Item>
        <Separator />
        <Item onClick={(e) => handleCopyString(e, 'name')}>{t('im.copy_image_name')}</Item>
        <Item onClick={(e) => handleCopyString(e, 'path')}>{t('im.copy_image_path')}</Item>
        <Item onClick={(e) => handleCopyString(e, 'path', copyImageAsBase64)}>{t('im.copy_image_base64')}</Item>

        <Separator hidden={isOperationHidden} />
        <Item hidden={isOperationHidden} onClick={handleCompressImage}>
          {t('im.compress')}
        </Item>
        <Item onClick={handleCropImage} hidden={isOperationHidden}>
          {t('im.crop')}
        </Item>
        <Item
          onClick={handleConvertFormat}
          hidden={(e) => _isOperationHidden(e as any) || e.props.image?.fileType === 'svg'}
        >
          {t('im.convert_format')}
        </Item>
        <Submenu label={t('im.find_similar_images')} arrow={<Arrow />} hidden={isOperationHidden}>
          <Item onClick={handleFindSimilarInSameLevel} hidden={isOperationHidden}>
            {t('im.current_directory')}
          </Item>
          <Item onClick={handleFindSimilarInAll} hidden={isOperationHidden}>
            {t('im.all_directories')}
          </Item>
        </Submenu>
        <Item onClick={handlePrettySvg} hidden={(e) => e.props.image?.fileType !== 'svg'}>
          {t('im.pretty')} svg
        </Item>

        <Separator hidden={isOperationHidden} />
        <Item onClick={handleRename} hidden={isOperationHidden}>
          {t('im.rename')} <RightSlot>{Keybinding.Enter}</RightSlot>
        </Item>

        <Item onClick={handleDelete} hidden={isOperationHidden}>
          {t('im.delete')} <RightSlot>{Keybinding.Delete}</RightSlot>
        </Item>

        <Separator />
        <Item onClick={(e) => showImageDetailModal(e.props.image)}>
          {t('im.detail')}
          <RightSlot>{t('im.double_click')}</RightSlot>
        </Item>
      </MaskMenu>
    </>
  )
}

export default memo(ImageContextMenu)
