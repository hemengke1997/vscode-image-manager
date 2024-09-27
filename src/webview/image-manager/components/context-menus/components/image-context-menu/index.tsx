import { memo } from 'react'
import {
  type HandlerParams,
  Item,
  type ItemParams,
  type PredicateParams,
  RightSlot,
  Separator,
  Submenu,
} from 'react-contexify'
import { useTranslation } from 'react-i18next'
import { useLockFn, useMemoizedFn } from 'ahooks'
import { App } from 'antd'
import { os } from 'un-detector'
import logger from '~/utils/logger'
import CtxMenuContext from '~/webview/image-manager/contexts/ctx-menu-context'
import useImageDetails from '~/webview/image-manager/hooks/use-image-details/use-image-details'
import useImageOperation from '~/webview/image-manager/hooks/use-image-operation'
import { Keybinding } from '~/webview/image-manager/keybinding'
import MaskMenu from '../../../mask-menu'
import Arrow from '../arrow'
import { type ImageContextMenuType } from './hooks/use-image-context-menu'

export const IMAGE_CONTEXT_MENU_ID = 'IMAGE_CONTEXT_MENU_ID'
const IMAGE_CONTEXT_MENU = {
  /**
   * sharp相关操作，包括：
   * 1. 压缩
   * 2. 裁剪
   * 3. 转化格式
   * 4. 查找相似图片
   * @default false
   */
  sharp: 'sharp',
  /**
   * 文件操作，包括：
   * 1. 重命名
   * 2. 删除
   * @default false
   */
  fs: 'fs',
  /**
   * svg相关操作，包括
   * 1. 格式化svg
   * @default false
   */
  svg: 'svg',
  /**
   * 在Viewer中显示
   * @default false
   */
  reveal_in_viewer: 'reveal_in_viewer',
}

export type EnableImageContextMenuType = {
  [key in keyof typeof IMAGE_CONTEXT_MENU]?: boolean
}

type ItemParamsContextMenu = ItemParams<Required<ImageContextMenuType>>

function ImageContextMenu() {
  const { t } = useTranslation()
  const { message } = App.useApp()

  const {
    openInOsExplorer,
    openInVscodeExplorer,
    handleCopyString,
    copyImageAsBase64,
    beginCompressProcess,
    cropImage,
    beginFormatConversionProcess,
    prettySvg,
    beginFindSimilarProcess,
    beginDeleteImageProcess,
    beginRenameImageProcess,
    beginRevealInViewer,
  } = useImageOperation()

  // 在os中打开图片
  const handleOpenInOsExplorer = useMemoizedFn((e: ItemParamsContextMenu) => {
    openInOsExplorer(e.props!.image.path)
  })

  // 在vscode中打开图片
  const handleOpenInVscodeExplorer = useMemoizedFn((e: ItemParamsContextMenu) => {
    openInVscodeExplorer(e.props!.image.path)
  })

  const isItemHidden = useMemoizedFn((e: PredicateParams<ImageContextMenuType>) => {
    const { data, props } = e
    if (Array.isArray(data)) {
      return data.every((d) => props?.enable?.[d] === false)
    }
    return props?.enable?.[data] === false
  })

  // 压缩图片
  const handleCompressImage = useMemoizedFn((e: ItemParamsContextMenu) => {
    beginCompressProcess(e.props!.images)
  })

  // 裁剪图片
  const handleCropImage = useLockFn(async (e: ItemParamsContextMenu) => {
    if (!e.props?.image) {
      return message.error(t('im.no_image'))
    }
    cropImage(e.props.image)
  })

  // 转化格式
  const handleConvertFormat = useLockFn(async (e: ItemParamsContextMenu) => {
    beginFormatConversionProcess(e.props!.images)
  })

  // 格式化svg
  const handlePrettySvg = useLockFn(async (e: ItemParamsContextMenu) => {
    try {
      const image = e.props!.image
      await prettySvg(image!.path)
      message.success(t('im.pretty_success'))
    } catch (e) {
      logger.error(e)
    }
  })

  const handleFindSimilar = useMemoizedFn(async (image: ImageType, images: ImageType[]) => {
    beginFindSimilarProcess(image, images)
  })

  const handleFindSimilarInSameLevel = useLockFn(async (e: ItemParamsContextMenu) => {
    const { image, sameLevelImages } = e.props || {}
    await handleFindSimilar(image!, sameLevelImages!)
  })

  const handleFindSimilarInAll = useLockFn(async (e: ItemParamsContextMenu) => {
    const { image, sameWorkspaceImages } = e.props || {}
    await handleFindSimilar(image!, sameWorkspaceImages!)
  })

  const handleDelete = useMemoizedFn(async (e: ItemParamsContextMenu) => {
    beginDeleteImageProcess(e.props!.images)
  })

  const handleRename = useMemoizedFn((e: ItemParamsContextMenu) => {
    beginRenameImageProcess(e.props!.image)
  })

  const handleRevealInViewer = useLockFn(async (e: ItemParamsContextMenu) => {
    beginRevealInViewer(e.props!.image)
  })

  const isSvg = useMemoizedFn((e: HandlerParams<Required<ImageContextMenuType>>) => {
    return e.props!.images.every((image) => image.fileType === 'svg') || false
  })

  const [showImageDetails] = useImageDetails()

  const { shortcutsVisible } = CtxMenuContext.usePicker(['shortcutsVisible'])

  return (
    <>
      <MaskMenu id={IMAGE_CONTEXT_MENU_ID}>
        <Item onClick={handleOpenInOsExplorer}>
          {os.isMac() ? t('im.reveal_in_os_mac') : t('im.reveal_in_os_windows')}
        </Item>
        <Item onClick={handleOpenInVscodeExplorer}>{t('im.reveal_in_explorer')}</Item>
        <Item onClick={handleRevealInViewer} hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.reveal_in_viewer}>
          {t('im.reveal_in_viewer')}
        </Item>
        <Separator />
        <Item onClick={(e) => handleCopyString(e.props!.image, { proto: 'name' })}>
          {t('im.copy_image_name')}
          <RightSlot hidden={!shortcutsVisible}>{Keybinding.Copy()}</RightSlot>
        </Item>
        <Item onClick={(e) => handleCopyString(e.props!.image, { proto: 'path' })}>{t('im.copy_image_path')}</Item>
        <Item onClick={(e) => handleCopyString(e.props!.image, { proto: 'relativePath' })}>
          {t('im.copy_image_relative_path')}
        </Item>
        <Item onClick={(e) => handleCopyString(e.props!.image, { proto: 'path' }, copyImageAsBase64)}>
          {t('im.copy_image_base64')}
        </Item>

        {/* sharp operation menu */}
        <Separator hidden={isItemHidden} data={[IMAGE_CONTEXT_MENU.sharp]} />
        <Item hidden={isItemHidden} onClick={handleCompressImage} data={IMAGE_CONTEXT_MENU.sharp}>
          {t('im.compress')}
        </Item>
        <Item onClick={handleConvertFormat} hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.sharp}>
          {t('im.convert_format')}
        </Item>
        <Item onClick={handleCropImage} hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.sharp}>
          {t('im.crop')}
        </Item>
        <Submenu
          label={t('im.find_similar_images')}
          arrow={<Arrow />}
          hidden={(e) =>
            isItemHidden({
              ...e,
              data: [IMAGE_CONTEXT_MENU.sharp],
            }) || isSvg(e)
          }
        >
          <Item onClick={handleFindSimilarInSameLevel} hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.sharp}>
            {t('im.current_directory')}
          </Item>
          <Item onClick={handleFindSimilarInAll} hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.sharp}>
            {t('im.all_directories')}
          </Item>
        </Submenu>
        <Item
          onClick={handlePrettySvg}
          hidden={(e) => isItemHidden({ ...e, data: [IMAGE_CONTEXT_MENU.svg] }) || !isSvg(e)}
        >
          {t('im.pretty')} svg
        </Item>

        {/* file operation menu */}
        <Separator hidden={isItemHidden} data={[IMAGE_CONTEXT_MENU.fs]} />
        <Item onClick={handleRename} hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.fs}>
          {t('im.rename')} <RightSlot hidden={!shortcutsVisible}>{Keybinding.Enter()}</RightSlot>
        </Item>
        <Item onClick={handleDelete} hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.fs}>
          {t('im.delete')} <RightSlot hidden={!shortcutsVisible}>{Keybinding.Delete()}</RightSlot>
        </Item>

        <Separator />
        <Item
          hidden={(e: PredicateParams<ImageContextMenuType>) => {
            return !e.props?.z_commands?.preview
          }}
          onClick={(e: ItemParamsContextMenu) => {
            e.props?.z_commands.preview?.onClick?.(e.props.image)
          }}
        >
          {t('im.preview')}
        </Item>

        <Item
          onClick={(e: ItemParamsContextMenu) => {
            showImageDetails({
              image: e.props!.image,
              onPreview: e.props?.z_commands?.preview?.onClick,
            })
          }}
        >
          {t('im.detail')}
          <RightSlot hidden={!shortcutsVisible}>{t('im.double_click')}</RightSlot>
        </Item>
      </MaskMenu>
    </>
  )
}

export default memo(ImageContextMenu)
