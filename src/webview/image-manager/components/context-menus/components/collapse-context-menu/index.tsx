import { useMemoizedFn } from '@minko-fe/react-hook'
import { App } from 'antd'
import { memo } from 'react'
import { Item, type ItemParams, type PredicateParams, RightSlot, Separator, Submenu } from 'react-contexify'
import { useTranslation } from 'react-i18next'
import { os } from 'un-detector'
import useImageOperation from '~/webview/image-manager/hooks/use-image-operation'
import { Keybinding } from '~/webview/image-manager/keybinding'
import MaskMenu from '../../../mask-menu'
import Arrow from '../arrow'
import { type CollapseContextMenuType } from './hooks/use-collapse-context-menu'

export const COLLAPSE_CONTEXT_MENU_ID = 'COLLAPSE_CONTEXT_MENU_ID'
export const COLLAPSE_CONTEXT_MENU = {
  /**
   * 在系统资源管理器中打开
   */
  open_in_os_explorer: 'open_in_os_explorer',
  /**
   * 在vscode资源管理器中打开
   */
  open_in_vscode_explorer: 'open_in_vscode_explorer',
  /**
   * 压缩当前文件夹下的图片
   */
  compress_in_current_directory: 'compress_in_current_directory',
  /**
   * 压缩当前文件夹下的所有图片（包括子目录）
   */
  compress_in_recursive_directories: 'compress_in_recursive_directories',
  /**
   * 转换当前文件夹下的图片格式
   */
  format_conversion_in_current_directory: 'format_conversion_in_current_directory',
  /**
   * 转换当前文件夹下的所有图片格式（包括子目录）
   */
  format_conversion_in_recursive_directories: 'format_conversion_in_recursive_directories',
  /**
   * 重命名目录
   */
  rename_directory: 'rename_directory',
  /**
   * 删除目录
   */
  delete_directory: 'delete_directory',
}

export type EnableCollapseContextMenuType =
  | {
      [key in keyof typeof COLLAPSE_CONTEXT_MENU]?: boolean
    }
  | boolean

function CollapseContextMenu() {
  const { t } = useTranslation()
  const { message } = App.useApp()

  const {
    openInOsExplorer,
    openInVscodeExplorer,
    beginCompressProcess,
    beginFormatConversionProcess,
    beginRenameDirProcess,
    beginDeleteDirProcess,
  } = useImageOperation()

  const isItemHidden = useMemoizedFn((e: PredicateParams<CollapseContextMenuType>) => {
    const { data, props } = e
    if (Array.isArray(data)) {
      return data.every((d) => props?.enable[d] === false)
    }
    return props?.enable[data] === false
  })

  const handleOpenInOsExplorer = useMemoizedFn((e: ItemParams<CollapseContextMenuType>) => {
    openInOsExplorer(e.props?.path || '')
  })

  const handleOpenInVscodeExplorer = useMemoizedFn((e: ItemParams<CollapseContextMenuType>) => {
    openInVscodeExplorer(e.props?.path || '')
  })

  const _compressImage = useMemoizedFn((images: ImageType[] | undefined) => {
    if (!images?.length) {
      return message.warning(t('im.no_image_to_compress'))
    }
    beginCompressProcess(images)
  })

  const handleCompressImage = useMemoizedFn((e: ItemParams<CollapseContextMenuType>) => {
    _compressImage(e.props!.images)
  })

  const handleCompressImageDeeply = useMemoizedFn((e: ItemParams<CollapseContextMenuType>) => {
    _compressImage(e.props!.underFolderDeeplyImages)
  })

  const _formatConversion = useMemoizedFn((images: ImageType[] | undefined) => {
    if (!images?.length) {
      return message.warning(t('im.no_image_to_convert_format'))
    }

    beginFormatConversionProcess(images)
  })

  const handleFormatConversion = useMemoizedFn((e: ItemParams<{ images: ImageType[] }>) => {
    _formatConversion(e.props!.images)
  })

  const handleFormatConversionDeeply = useMemoizedFn((e: ItemParams<CollapseContextMenuType>) => {
    _formatConversion(e.props!.underFolderDeeplyImages)
  })

  const handleRenameDir = useMemoizedFn((e: ItemParams<CollapseContextMenuType>) => {
    beginRenameDirProcess(e.props?.path || '')
  })

  const handleDeleteDir = useMemoizedFn((e: ItemParams<CollapseContextMenuType>) => {
    beginDeleteDirProcess(e.props?.path || '')
  })

  return (
    <>
      <MaskMenu id={COLLAPSE_CONTEXT_MENU_ID}>
        <Item hidden={isItemHidden} onClick={handleOpenInOsExplorer} data={COLLAPSE_CONTEXT_MENU.open_in_os_explorer}>
          {os.isMac() ? t('im.reveal_in_os_mac') : t('im.reveal_in_os_windows')}
        </Item>
        <Item
          hidden={isItemHidden}
          onClick={handleOpenInVscodeExplorer}
          data={COLLAPSE_CONTEXT_MENU.open_in_vscode_explorer}
        >
          {t('im.reveal_in_explorer')}
        </Item>

        <Separator
          hidden={isItemHidden}
          data={[COLLAPSE_CONTEXT_MENU.open_in_os_explorer, COLLAPSE_CONTEXT_MENU.open_in_vscode_explorer]}
        />
        <Submenu
          label={t('im.compress')}
          hidden={(e) =>
            isItemHidden({
              ...e,
              data: [
                COLLAPSE_CONTEXT_MENU.compress_in_current_directory,
                COLLAPSE_CONTEXT_MENU.compress_in_recursive_directories,
              ],
            })
          }
          arrow={<Arrow />}
        >
          <Item
            hidden={isItemHidden}
            onClick={handleCompressImage}
            data={COLLAPSE_CONTEXT_MENU.compress_in_current_directory}
          >
            {t('im.current_directory')}
          </Item>
          <Item
            hidden={isItemHidden}
            onClick={handleCompressImageDeeply}
            data={COLLAPSE_CONTEXT_MENU.compress_in_recursive_directories}
          >
            {t('im.recursive_directories')}
          </Item>
        </Submenu>
        <Submenu
          label={t('im.convert_format')}
          hidden={(e) =>
            isItemHidden({
              ...e,
              data: [
                COLLAPSE_CONTEXT_MENU.format_conversion_in_current_directory,
                COLLAPSE_CONTEXT_MENU.format_conversion_in_recursive_directories,
              ],
            })
          }
          arrow={<Arrow />}
        >
          <Item
            hidden={isItemHidden}
            onClick={handleFormatConversion}
            data={COLLAPSE_CONTEXT_MENU.format_conversion_in_current_directory}
          >
            {t('im.current_directory')}
          </Item>
          <Item
            hidden={isItemHidden}
            onClick={handleFormatConversionDeeply}
            data={COLLAPSE_CONTEXT_MENU.format_conversion_in_recursive_directories}
          >
            {t('im.recursive_directories')}
          </Item>
        </Submenu>

        <Separator
          hidden={isItemHidden}
          data={[COLLAPSE_CONTEXT_MENU.rename_directory, COLLAPSE_CONTEXT_MENU.delete_directory]}
        />
        <Item hidden={isItemHidden} data={COLLAPSE_CONTEXT_MENU.rename_directory} onClick={handleRenameDir}>
          {t('im.rename')} <RightSlot>{Keybinding.Enter()}</RightSlot>
        </Item>
        <Item hidden={isItemHidden} data={COLLAPSE_CONTEXT_MENU.delete_directory} onClick={handleDeleteDir}>
          {t('im.delete')} <RightSlot>{Keybinding.Delete()}</RightSlot>
        </Item>
      </MaskMenu>
    </>
  )
}

export default memo(CollapseContextMenu)
