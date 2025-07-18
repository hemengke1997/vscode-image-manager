import type { ItemParams, PredicateParams } from 'react-contexify'
import type { CollapseContextMenuType } from './hooks/use-collapse-context-menu'
import { useMemoizedFn } from 'ahooks'
import { App } from 'antd'
import { defaults } from 'es-toolkit/compat'
import { useAtomValue } from 'jotai'
import { memo } from 'react'
import { Item, RightSlot, Separator, Submenu } from 'react-contexify'
import { useTranslation } from 'react-i18next'
import useImageOperation from '~/webview/image-manager/hooks/use-image-operation'
import { Keybinding } from '~/webview/image-manager/keybinding'
import { FileAtoms } from '~/webview/image-manager/stores/file/file-store'
import { GlobalAtoms } from '~/webview/image-manager/stores/global/global-store'
import { OS } from '~/webview/image-manager/utils/device'
import MaskMenu from '../../../mask-menu'
import Arrow from '../arrow'

export const COLLAPSE_CONTEXT_MENU_ID = 'COLLAPSE_CONTEXT_MENU_ID'
enum COLLAPSE_CONTEXT_MENU {
  open_in_os_explorer = 'open_in_os_explorer',
  open_in_vscode_explorer = 'open_in_vscode_explorer',
  compress_in_current_directory = 'compress_in_current_directory',
  compress_in_recursive_directories = 'compress_in_recursive_directories',
  format_conversion_in_current_directory = 'format_conversion_in_current_directory',
  format_conversion_in_recursive_directories = 'format_conversion_in_recursive_directories',
  rename_directory = 'rename_directory',
  delete_directory = 'delete_directory',
  paste = 'paste',
}

const defaultCollapseContextMenu = {
  /**
   * 在系统资源管理器中打开
   * @default true
   */
  [COLLAPSE_CONTEXT_MENU.open_in_os_explorer]: true,
  /**
   * 在vscode资源管理器中打开
   * @default true
   */
  [COLLAPSE_CONTEXT_MENU.open_in_vscode_explorer]: true,
  /**
   * 压缩当前文件夹下的图片
   * @default false
   */
  [COLLAPSE_CONTEXT_MENU.compress_in_current_directory]: false,
  /**
   * 压缩当前文件夹下的所有图片（包括子目录）
   * @default false
   */
  [COLLAPSE_CONTEXT_MENU.compress_in_recursive_directories]: false,
  /**
   * 转换当前文件夹下的图片格式
   * @default false
   */
  [COLLAPSE_CONTEXT_MENU.format_conversion_in_current_directory]: false,
  /**
   * 转换当前文件夹下的所有图片格式（包括子目录）
   * @default false
   */
  [COLLAPSE_CONTEXT_MENU.format_conversion_in_recursive_directories]: false,
  /**
   * 重命名目录
   * @default false
   */
  [COLLAPSE_CONTEXT_MENU.rename_directory]: false,
  /**
   * 删除目录
   * @default false
   */
  [COLLAPSE_CONTEXT_MENU.delete_directory]: false,
  /**
   * 粘贴图片
   * @default true
   */
  [COLLAPSE_CONTEXT_MENU.paste]: true,
}

const sharpRelated = [
  COLLAPSE_CONTEXT_MENU.compress_in_current_directory,
  COLLAPSE_CONTEXT_MENU.compress_in_recursive_directories,
  COLLAPSE_CONTEXT_MENU.format_conversion_in_current_directory,
  COLLAPSE_CONTEXT_MENU.format_conversion_in_recursive_directories,
]

export type EnableCollapseContextMenuType = Partial<typeof defaultCollapseContextMenu>

function CollapseContextMenu() {
  const { t } = useTranslation()
  const { message } = App.useApp()

  const sharpInstalled = useAtomValue(GlobalAtoms.sharpInstalledAtom)

  const {
    openInOsExplorer,
    openInVscodeExplorer,
    beginCompressProcess,
    beginFormatConversionProcess,
    beginRenameDirProcess,
    beginDeleteDirProcess,
    beginPasteProcess,
  } = useImageOperation()

  const isItemHidden = useMemoizedFn((e: PredicateParams<CollapseContextMenuType>) => {
    const { data, props } = e
    const enabled = defaults(props?.enableContextMenu || {}, defaultCollapseContextMenu)

    if (!sharpInstalled) {
      sharpRelated.forEach((item) => {
        enabled[item] = false
      })
    }

    if (Array.isArray(data)) {
      return data.every(d => enabled?.[d] === false)
    }
    return enabled?.[data] === false
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
    _compressImage(e.props!.subfolderImages)
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
    _formatConversion(e.props!.subfolderImages)
  })

  const handleRenameDir = useMemoizedFn((e: ItemParams<CollapseContextMenuType>) => {
    beginRenameDirProcess(e.props?.path || '')
  })

  const handleDeleteDir = useMemoizedFn((e: ItemParams<CollapseContextMenuType>) => {
    beginDeleteDirProcess(e.props?.path || '')
  })

  const hanldePasteImage = useMemoizedFn((e: ItemParams<CollapseContextMenuType>) => {
    beginPasteProcess(e.props?.path || '').finally(() => {
      e.props?.onPaste?.()
    })
  })

  const imageCopied = useAtomValue(FileAtoms.imageCopied)

  return (
    <>
      <MaskMenu id={COLLAPSE_CONTEXT_MENU_ID}>
        <Item hidden={isItemHidden} onClick={handleOpenInOsExplorer} data={COLLAPSE_CONTEXT_MENU.open_in_os_explorer}>
          {OS.isMac ? t('im.reveal_in_os_mac') : t('im.reveal_in_os_windows')}
        </Item>
        <Item
          hidden={isItemHidden}
          onClick={handleOpenInVscodeExplorer}
          data={COLLAPSE_CONTEXT_MENU.open_in_vscode_explorer}
        >
          {t('im.reveal_in_explorer')}
        </Item>

        <Separator hidden={isItemHidden} data={COLLAPSE_CONTEXT_MENU.paste} />
        <Item
          hidden={isItemHidden}
          disabled={!imageCopied?.list.length}
          onClick={hanldePasteImage}
          data={COLLAPSE_CONTEXT_MENU.paste}
        >
          {t('im.paste')}
          <RightSlot>{Keybinding.Paste()}</RightSlot>
        </Item>

        <Separator hidden={isItemHidden} data={sharpRelated} />
        <Submenu
          label={t('im.compress')}
          hidden={e =>
            isItemHidden({
              ...e,
              data: [
                COLLAPSE_CONTEXT_MENU.compress_in_current_directory,
                COLLAPSE_CONTEXT_MENU.compress_in_recursive_directories,
              ],
            })}
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
          hidden={e =>
            isItemHidden({
              ...e,
              data: [
                COLLAPSE_CONTEXT_MENU.format_conversion_in_current_directory,
                COLLAPSE_CONTEXT_MENU.format_conversion_in_recursive_directories,
              ],
            })}
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
          {t('im.rename')}
          {' '}
          <RightSlot>{Keybinding.Rename()}</RightSlot>
        </Item>
        <Item hidden={isItemHidden} data={COLLAPSE_CONTEXT_MENU.delete_directory} onClick={handleDeleteDir}>
          {t('im.delete')}
          {' '}
          <RightSlot>{Keybinding.Delete()}</RightSlot>
        </Item>
      </MaskMenu>
    </>
  )
}

export default memo(CollapseContextMenu)
