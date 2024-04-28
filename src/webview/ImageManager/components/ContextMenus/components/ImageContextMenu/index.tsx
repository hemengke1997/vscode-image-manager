import { useLockFn, useMemoizedFn } from '@minko-fe/react-hook'
import { App } from 'antd'
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
import { os } from 'un-detector'
import logger from '~/utils/logger'
import { type ImageContextMenuType } from '~/webview/ImageManager/components/ContextMenus/components/ImageContextMenu/hooks/useImageContextMenu'
import useImageDetail from '~/webview/ImageManager/hooks/useImageDetail/useImageDetail'
import useImageOperation from '~/webview/ImageManager/hooks/useImageOperation'
import { Keybinding } from '~/webview/ImageManager/keybinding'
import MaskMenu from '../../../MaskMenu'
import Arrow from '../Arrow'

export const IMAGE_CONTEXT_MENU_ID = 'IMAGE_CONTEXT_MENU_ID'
const IMAGE_CONTEXT_MENU = {
  /**
   * sharp相关操作
   * @default false
   */
  sharp: 'sharp',
  /**
   * 文件操作
   * @default false
   */
  fs: 'fs',
  /**
   * svg相关操作
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
    beginDeleteImageProcess,
    beginRenameImageProcess,
    beginRevealInViewer,
  } = useImageOperation()

  // 复制图片 name | path | base64
  const handleCopyString = useLockFn(
    async (
      e: ItemParams<ImageContextMenuType>,
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
  const handleOpenInOsExplorer = useMemoizedFn((e: ItemParams<ImageContextMenuType>) => {
    openInOsExplorer(e.props!.image.path)
  })

  // 在vscode中打开图片
  const handleOpenInVscodeExplorer = useMemoizedFn((e: ItemParams<ImageContextMenuType>) => {
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
  const handleCompressImage = useMemoizedFn((e: ItemParams<ImageContextMenuType>) => {
    beginCompressProcess([e.props!.image], {
      fields: {
        /**
         * 单文件压缩时，不跳过压缩流程
         */
        skipCompressed: {
          el() {
            return null
          },
          value: false,
        },
      },
    })
  })

  // 裁剪图片
  const handleCropImage = useLockFn(async (e: ItemParams<ImageContextMenuType>) => {
    if (!e.props?.image) {
      return message.error(t('im.no_image'))
    }
    cropImage(e.props.image)
  })

  // 转化格式
  const handleConvertFormat = useLockFn(async (e: ItemParams<ImageContextMenuType>) => {
    beginFormatConversionProcess([e.props!.image])
  })

  // 格式化svg
  const handlePrettySvg = useLockFn(async (e: ItemParams<ImageContextMenuType>) => {
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
  const handleFindSimilarInSameLevel = useLockFn(async (e: ItemParams<ImageContextMenuType>) => {
    const { image, sameLevelImages } = e.props || {}
    await handleFindSimilar(image!, sameLevelImages!)
  })
  const handleFindSimilarInAll = useLockFn(async (e: ItemParams<ImageContextMenuType>) => {
    const { image, sameWorkspaceImages } = e.props || {}

    await handleFindSimilar(image!, sameWorkspaceImages!)
  })

  const handleDelete = useMemoizedFn(async (e: ItemParams<ImageContextMenuType>) => {
    beginDeleteImageProcess(e.props!.image)
  })

  const handleRename = useMemoizedFn((e: ItemParams<ImageContextMenuType>) => {
    beginRenameImageProcess(e.props!.image)
  })

  const { showImageDetailModal } = useImageDetail()

  const handleRevealInViewer = useLockFn(async (e: ItemParams<ImageContextMenuType>) => {
    beginRevealInViewer(e.props!.image)
  })

  const isSvg = useMemoizedFn((e: HandlerParams<ImageContextMenuType>) => {
    return e.props?.image.fileType === 'svg'
  })

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
        <Item onClick={(e) => handleCopyString(e, 'name')}>{t('im.copy_image_name')}</Item>
        <Item onClick={(e) => handleCopyString(e, 'path')}>{t('im.copy_image_path')}</Item>
        <Item onClick={(e) => handleCopyString(e, 'path', copyImageAsBase64)}>{t('im.copy_image_base64')}</Item>

        {/* sharp operation menu */}
        <Separator hidden={isItemHidden} data={[IMAGE_CONTEXT_MENU.sharp]} />
        <Item hidden={isItemHidden} onClick={handleCompressImage} data={IMAGE_CONTEXT_MENU.sharp}>
          {t('im.compress')}
        </Item>
        <Item onClick={handleCropImage} hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.sharp}>
          {t('im.crop')}
        </Item>
        <Item onClick={handleConvertFormat} hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.sharp}>
          {t('im.convert_format')}
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
          hidden={(e: HandlerParams<ImageContextMenuType>) =>
            isItemHidden({ ...e, data: [IMAGE_CONTEXT_MENU.svg] }) || !isSvg(e)
          }
        >
          {t('im.pretty')} svg
        </Item>

        {/* file operation menu */}
        <Separator hidden={isItemHidden} data={[IMAGE_CONTEXT_MENU.fs]} />
        <Item onClick={handleRename} hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.fs}>
          {t('im.rename')} <RightSlot>{Keybinding.Enter}</RightSlot>
        </Item>
        <Item onClick={handleDelete} hidden={isItemHidden} data={IMAGE_CONTEXT_MENU.fs}>
          {t('im.delete')} <RightSlot>{Keybinding.Delete}</RightSlot>
        </Item>

        <Separator />
        <Item onClick={(e: ItemParams<ImageContextMenuType>) => showImageDetailModal(e.props!.image)}>
          {t('im.detail')}
          <RightSlot>{t('im.double_click')}</RightSlot>
        </Item>
      </MaskMenu>
    </>
  )
}

export default memo(ImageContextMenu)
