import { memo, type PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { IoMdFolderOpen } from 'react-icons/io'
import useImageOperation from '~/webview/image-manager/hooks/use-image-operation'
import { OS } from '~/webview/image-manager/utils/device'
import RevealButton from '../reveal-button'

interface Props {
  path: string
}

function RevealInFolder(props: PropsWithChildren<Props>) {
  const { t } = useTranslation()
  const { path, children } = props
  const { openInOsExplorer } = useImageOperation()

  return (
    <RevealButton
      onClick={() => {
        openInOsExplorer(path)
      }}
      title={OS.isMac ? t('im.reveal_in_os_mac') : t('im.reveal_in_os_windows')}
    >
      {children || <IoMdFolderOpen />}
    </RevealButton>
  )
}
export default memo(RevealInFolder)
