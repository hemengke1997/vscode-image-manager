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
import defaults from 'defaults'
import { os } from 'un-detector'
import logger from '~/utils/logger'
import useImageDetails from '~/webview/image-manager/hooks/use-image-details/use-image-details'
import useImageOperation from '~/webview/image-manager/hooks/use-image-operation'
import { Keybinding } from '~/webview/image-manager/keybinding'
import GlobalStore from '~/webview/image-manager/stores/global-store'
import MaskMenu from '../../../mask-menu'
import Arrow from '../arrow'
import { type ImageContextMenuType } from './hooks/use-image-context-menu'

export const IMAGE_CONTEXT_MENU_ID = 'IMAGE_CONTEXT_MENU_ID'

export enum IMAGE_CONTEXT_MENU {
  open_in_os_explorer = 'open_in_os_explorer',
  open_in_vscode_explorer = 'open_in_vscode_explorer',
  reveal_in_viewer = 'reveal_in_viewer',
  copy = 'copy',
  cut = 'cut',
  compress = 'compress',
  format_conversion = 'format_conversion',
  crop = 'crop',
  find_similar_in_same_level = 'find_similar_in_same_level',
  find_similar_in_all = 'find_similar_in_all',
  pretty_svg = 'pretty_svg',
  rename = 'rename',
  delete = 'delete',
  preview = 'preview',
  view_detail = 'view_detail',
}

const defaultImageContextMenu = {
  /**
   * 在系统资源管理器中打开
   * @default true
   */
  [IMAGE_CONTEXT_MENU.open_in_os_explorer]: true,
  /**
   * 在vscode资源管理器中打开
   * @default true
   */
  [IMAGE_CONTEXT_MENU.open_in_vscode_explorer]: true,
  /**
   * 在Viewer中显示
   * @default true
   */
  [IMAGE_CONTEXT_MENU.reveal_in_viewer]: true,
  /**
   * 复制
   * @default false
   */
  [IMAGE_CONTEXT_MENU.copy]: false,
  /**
   * 剪切
   * @default false
   */
  [IMAGE_CONTEXT_MENU.cut]: false,
  /**
   * 压缩
   * @default false
   */
  [IMAGE_CONTEXT_MENU.compress]: false,
  /**
   * 转化格式
   * @default false
   */
  [IMAGE_CONTEXT_MENU.format_conversion]: false,
  /**
   * 裁剪
   * @default false
   */
  [IMAGE_CONTEXT_MENU.crop]: false,
  /**
   * 查找相似(同目录)
   * @default false
   */
  [IMAGE_CONTEXT_MENU.find_similar_in_same_level]: false,
  /**
   * 查找相似(所有)
   * @default false
   */
  [IMAGE_CONTEXT_MENU.find_similar_in_all]: false,
  /**
   * 格式化svg
   * @default false
   */
  [IMAGE_CONTEXT_MENU.pretty_svg]: false,
  /**
   * 重命名
   * @default false
   */
  [IMAGE_CONTEXT_MENU.rename]: false,
  /**
   * 删除
   * @default false
   */
  [IMAGE_CONTEXT_MENU.delete]: false,

  /**
   * 预览
   * @default true
   */
  [IMAGE_CONTEXT_MENU.preview]: false,
  /**
   * 查看详情
   * @default true
   */
  [IMAGE_CONTEXT_MENU.view_detail]: true,
}

export type EnableImageContextMenuType = Partial<typeof defaultImageContextMenu>

type ItemParamsContextMenu = ItemParams<Required<ImageContextMenuType>>

const sharpRelated = [
  IMAGE_CONTEXT_MENU.compress,
  IMAGE_CONTEXT_MENU.format_conversion,
  IMAGE_CONTEXT_MENU.crop,
  IMAGE_CONTEXT_MENU.find_similar_in_same_level,
  IMAGE_CONTEXT_MENU.find_similar_in_all,
]

function ImageContextMenu() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const { sharpInstalled } = GlobalStore.useStore(['sharpInstalled'])

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
    beginCopyProcess,
    beginCutProcess,
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

    const enabled = defaults(props?.enableContextMenu || {}, defaultImageContextMenu)

    if (!sharpInstalled) {
      sharpRelated.forEach((item) => {
        enabled[item] = false
      })
    }

    if (Array.isArray(data)) {
      return data.every((d) => enabled?.[d] === false)
    }
    return enabled?.[data] === false
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
    beginRenameImageProcess(e.props!.image, e.props!.images)
  })

  const handleRevealInViewer = useLockFn(async (e: ItemParamsContextMenu) => {
    beginRevealInViewer(e.props!.image.path)
  })

  const isSvg = useMemoizedFn((e: HandlerParams<Required<ImageContextMenuType>>) => {
    return e.props!.images.every((image) => image.extname === 'svg') || false
  })

  const { showImageDetails } = useImageDetails()

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

        {/* 按照vscode的交互，复制/剪切是单独分组的 */}
        <Separator hidden={isItemHidden} data={[IMAGE_CONTEXT_MENU.copy, IMAGE_CONTEXT_MENU.cut]} />
        <Item hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.copy} onClick={(e) => beginCopyProcess(e.props!.images)}>
          {(e: ItemParamsContextMenu) => (
            <>
              {t('im.copy')}
              <RightSlot hidden={!e.props!.shortcutsVisible}>{Keybinding.Copy()}</RightSlot>
            </>
          )}
        </Item>
        <Item hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.cut} onClick={(e) => beginCutProcess(e.props!.images)}>
          {(e: ItemParamsContextMenu) => (
            <>
              {t('im.cut')}
              <RightSlot hidden={!e.props!.shortcutsVisible}>{Keybinding.Cut()}</RightSlot>
            </>
          )}
        </Item>

        <Separator />
        <Item onClick={(e) => handleCopyString(e.props!.image, { proto: 'name' })}>{t('im.copy_image_name')}</Item>
        <Submenu label={t('im.copy_image_path')} arrow={<Arrow />}>
          <Item onClick={(e) => handleCopyString(e.props!.image, { proto: 'path' })}>
            {t('im.copy_image_absolute_path')}
          </Item>
          <Item onClick={(e) => handleCopyString(e.props!.image, { proto: 'relativePath' })}>
            {t('im.copy_image_relative_path')}
          </Item>
        </Submenu>

        <Item onClick={(e) => handleCopyString(e.props!.image, { proto: 'path', callback: copyImageAsBase64 })}>
          {t('im.copy_image_base64')}
        </Item>

        {/* sharp operation menu */}
        <Separator hidden={isItemHidden} data={sharpRelated} />
        <Item hidden={isItemHidden} onClick={handleCompressImage} data={IMAGE_CONTEXT_MENU.compress}>
          {t('im.compress')}
        </Item>
        <Item onClick={handleConvertFormat} hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.format_conversion}>
          {t('im.convert_format')}
        </Item>
        <Item onClick={handleCropImage} hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.crop}>
          {t('im.crop')}
        </Item>
        <Submenu
          label={t('im.find_similar_images')}
          arrow={<Arrow />}
          hidden={(e) =>
            isItemHidden({
              ...e,
              data: [IMAGE_CONTEXT_MENU.find_similar_in_same_level, IMAGE_CONTEXT_MENU.find_similar_in_all],
            }) || isSvg(e)
          }
        >
          <Item
            onClick={handleFindSimilarInSameLevel}
            hidden={isItemHidden}
            data={IMAGE_CONTEXT_MENU.find_similar_in_same_level}
          >
            {t('im.current_directory')}
          </Item>
          <Item onClick={handleFindSimilarInAll} hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.find_similar_in_all}>
            {t('im.all_directories')}
          </Item>
        </Submenu>

        <Item
          onClick={handlePrettySvg}
          hidden={(e) => isItemHidden({ ...e, data: [IMAGE_CONTEXT_MENU.pretty_svg] }) || !isSvg(e)}
        >
          {t('im.pretty')} svg
        </Item>

        {/* file operation menu */}
        <Separator hidden={isItemHidden} data={[IMAGE_CONTEXT_MENU.rename, IMAGE_CONTEXT_MENU.delete]} />
        <Item onClick={handleRename} hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.rename}>
          {(e: ItemParamsContextMenu) => (
            <>
              {t('im.rename')} <RightSlot hidden={!e.props!.shortcutsVisible}>{Keybinding.Rename()}</RightSlot>
            </>
          )}
        </Item>
        <Item onClick={handleDelete} hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.delete}>
          {(e: ItemParamsContextMenu) => (
            <>
              {t('im.delete')} <RightSlot hidden={!e.props!.shortcutsVisible}>{Keybinding.Delete()}</RightSlot>
            </>
          )}
        </Item>

        <Separator />
        <Item
          hidden={isItemHidden}
          data={IMAGE_CONTEXT_MENU.preview}
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
          {(e: ItemParamsContextMenu) => (
            <>
              {t('im.detail')}
              <RightSlot hidden={!e.props!.shortcutsVisible}>{t('im.double_click')}</RightSlot>
            </>
          )}
        </Item>
      </MaskMenu>
    </>
  )
}

export default memo(ImageContextMenu)
