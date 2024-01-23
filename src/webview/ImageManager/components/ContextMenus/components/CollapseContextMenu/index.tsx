import { useMemoizedFn } from '@minko-fe/react-hook'
import { memo } from 'react'
import { Item, type ItemParams, Separator } from 'react-contexify'
import { useTranslation } from 'react-i18next'
import { os } from 'un-detector'
import { type ImageType } from '@/webview/ImageManager'
import useImageOperation from '@/webview/ImageManager/hooks/useImageOperation'
import MaskMenu from '../../../MaskMenu'

export const COLLAPSE_CONTEXT_MENU_ID = 'COLLAPSE_CONTEXT_MENU_ID'

function CollapseContextMenu() {
  const { t } = useTranslation()

  const { openInOsExplorer, openInVscodeExplorer, beginCompressProcess } = useImageOperation()

  const handleOpenInOsExplorer = (e: ItemParams<{ targetPath: string }>) => {
    openInOsExplorer(e.props?.targetPath || '')
  }

  const handleOpenInVscodeExplorer = (e: ItemParams<{ targetPath: string }>) => {
    openInVscodeExplorer(e.props?.targetPath || '')
  }

  const handleCompressImage = useMemoizedFn((e: ItemParams<{ images: ImageType[] }>) => {
    beginCompressProcess(e.props!.images)
  })

  return (
    <>
      <MaskMenu id={COLLAPSE_CONTEXT_MENU_ID}>
        <Item onClick={handleCompressImage}>{t('im.compress_under_folder')}</Item>
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
