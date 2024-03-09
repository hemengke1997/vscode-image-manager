import { useMemoizedFn } from '@minko-fe/react-hook'
import { App } from 'antd'
import { memo } from 'react'
import { Item, type ItemParams, type PredicateParams, Separator } from 'react-contexify'
import { useTranslation } from 'react-i18next'
import { os } from 'un-detector'
import { type ImageType } from '~/webview/ImageManager'
import useImageOperation from '~/webview/ImageManager/hooks/useImageOperation'
import MaskMenu from '../../../MaskMenu'

export const COLLAPSE_CONTEXT_MENU_ID = 'COLLAPSE_CONTEXT_MENU_ID'
export const COLLAPSE_CONTEXT_MENU = {
  openInOsExplorer: 'openInOsExplorer',
  openInVscodeExplorer: 'openInVscodeExplorer',
  compressImage: 'compressImage',
}

export type CollapseContextMenuType =
  | {
      [key in keyof typeof COLLAPSE_CONTEXT_MENU]?: boolean
    }
  | boolean

function CollapseContextMenu() {
  const { t } = useTranslation()
  const { message } = App.useApp()

  const { openInOsExplorer, openInVscodeExplorer, beginCompressProcess } = useImageOperation()

  const handleOpenInOsExplorer = (e: ItemParams<{ targetPath: string }>) => {
    openInOsExplorer(e.props?.targetPath || '')
  }

  const handleOpenInVscodeExplorer = (e: ItemParams<{ targetPath: string }>) => {
    openInVscodeExplorer(e.props?.targetPath || '')
  }

  const handleCompressImage = useMemoizedFn(
    (e: ItemParams<{ images: ImageType[]; contextMenu: CollapseContextMenuType }>) => {
      if (!e.props!.images?.length) {
        // 无可压缩的图片，提示用户
        return message.warning(t('im.no_image_to_compress'))
      }
      beginCompressProcess(e.props!.images)
    },
  )

  const isItemHidden = (e: PredicateParams<{ contextMenu: CollapseContextMenuType }>) => {
    const { data, props } = e
    if (Array.isArray(data)) {
      return data.every((d) => props?.contextMenu[d] === false)
    }
    return props?.contextMenu[data] === false
  }

  return (
    <>
      <MaskMenu id={COLLAPSE_CONTEXT_MENU_ID}>
        <Item hidden={isItemHidden} onClick={handleCompressImage} data={COLLAPSE_CONTEXT_MENU.compressImage}>
          {t('im.compress_under_folder')}
        </Item>
        <Separator
          hidden={isItemHidden}
          data={[COLLAPSE_CONTEXT_MENU.openInOsExplorer, COLLAPSE_CONTEXT_MENU.openInVscodeExplorer]}
        />
        <Item hidden={isItemHidden} onClick={handleOpenInOsExplorer} data={COLLAPSE_CONTEXT_MENU.openInOsExplorer}>
          {os.isMac() ? t('im.reveal_in_os_mac') : t('im.reveal_in_os_windows')}
        </Item>
        <Item
          hidden={isItemHidden}
          onClick={handleOpenInVscodeExplorer}
          data={COLLAPSE_CONTEXT_MENU.openInVscodeExplorer}
        >
          {t('im.reveal_in_explorer')}
        </Item>
      </MaskMenu>
    </>
  )
}

export default memo(CollapseContextMenu)
