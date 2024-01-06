import useImageOperation from '@rootSrc/webview/ImageManager/hooks/useImageOperation'
import GlobalContext from '@rootSrc/webview/ui-framework/src/contexts/GlobalContext'
import { memo } from 'react'
import { Item, type ItemParams, Menu } from 'react-contexify'
import { useTranslation } from 'react-i18next'
import { os } from 'un-detector'

export const COLLAPSE_CONTEXT_MENU_ID = 'COLLAPSE_CONTEXT_MENU_ID'

function CollapseContextMenu() {
  const { theme } = GlobalContext.usePicker(['theme'])
  const { t } = useTranslation()

  const { openInOsExplorer, openInVscodeExplorer } = useImageOperation()

  const handleOpenInOsExplorer = (e: ItemParams<{ dirPath: string }>) => {
    openInOsExplorer(e.props?.dirPath || '')
  }

  const handleOpenInVscodeExplorer = (e: ItemParams<{ dirPath: string }>) => {
    openInVscodeExplorer(e.props?.dirPath || '')
  }

  return (
    <Menu id={COLLAPSE_CONTEXT_MENU_ID} theme={theme}>
      <Item onClick={handleOpenInOsExplorer}>
        {os.isMac() ? t('ia.reveal_in_os_mac') : t('ia.reveal_in_os_windows')}
      </Item>
      <Item onClick={handleOpenInVscodeExplorer}>{t('ia.reveal_in_explorer')}</Item>
    </Menu>
  )
}

export default memo(CollapseContextMenu)
