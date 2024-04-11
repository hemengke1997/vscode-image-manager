import { useMemoizedFn } from '@minko-fe/react-hook'
import { App } from 'antd'
import { memo } from 'react'
import { Item, type ItemParams, type PredicateParams, Separator, Submenu } from 'react-contexify'
import { useTranslation } from 'react-i18next'
import { os } from 'un-detector'
import useImageOperation from '~/webview/ImageManager/hooks/useImageOperation'
import MaskMenu from '../../../MaskMenu'
import Arrow from '../Arrow'

export const COLLAPSE_CONTEXT_MENU_ID = 'COLLAPSE_CONTEXT_MENU_ID'
export const COLLAPSE_CONTEXT_MENU = {
  open_in_os_explorer: 'open_in_os_explorer',
  open_in_vscode_explorer: 'open_in_vscode_explorer',
  compress_in_current_directory: 'compress_in_current_directory',
  compress_in_recursive_directories: 'compress_in_recursive_directories',
  format_conversion_in_current_directory: 'format_conversion_in_current_directory',
  format_conversion_in_recursive_directories: 'format_conversion_in_recursive_directories',
}

export type CollapseContextMenuType =
  | {
      [key in keyof typeof COLLAPSE_CONTEXT_MENU]?: boolean
    }
  | boolean

function CollapseContextMenu() {
  const { t } = useTranslation()
  const { message } = App.useApp()

  const { openInOsExplorer, openInVscodeExplorer, beginCompressProcess, beginFormatConversionProcess } =
    useImageOperation()

  const isItemHidden = (e: PredicateParams<{ contextMenu: CollapseContextMenuType }>) => {
    const { data, props } = e
    if (Array.isArray(data)) {
      return data.every((d) => props?.contextMenu[d] === false)
    }
    return props?.contextMenu[data] === false
  }

  const handleOpenInOsExplorer = (e: ItemParams<{ targetPath: string }>) => {
    openInOsExplorer(e.props?.targetPath || '')
  }

  const handleOpenInVscodeExplorer = (e: ItemParams<{ targetPath: string }>) => {
    openInVscodeExplorer(e.props?.targetPath || '')
  }

  const _compressImage = useMemoizedFn((images: ImageType[] | undefined) => {
    if (!images?.length) {
      return message.warning(t('im.no_image_to_compress'))
    }
    beginCompressProcess(images)
  })

  const handleCompressImage = useMemoizedFn((e: ItemParams<{ images: ImageType[] }>) => {
    _compressImage(e.props!.images)
  })

  const handleCompressImageDeeply = useMemoizedFn((e: ItemParams<{ underFolderDeeplyImages: ImageType[] }>) => {
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

  const handleFormatConversionDeeply = useMemoizedFn((e: ItemParams<{ underFolderDeeplyImages: ImageType[] }>) => {
    _formatConversion(e.props!.underFolderDeeplyImages)
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
      </MaskMenu>
    </>
  )
}

export default memo(CollapseContextMenu)
