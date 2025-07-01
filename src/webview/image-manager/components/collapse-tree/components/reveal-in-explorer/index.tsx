import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { VscVscodeInsiders } from 'react-icons/vsc'
import useImageOperation from '~/webview/image-manager/hooks/use-image-operation'
import RevealButton from '../reveal-button'

type Props = {
  path: string
}

function RevealInExplorer(props: Props) {
  const { t } = useTranslation()
  const { path } = props
  const { openInVscodeExplorer } = useImageOperation()

  return (
    <RevealButton onClick={() => openInVscodeExplorer(path)} title={t('im.reveal_in_explorer')}>
      <VscVscodeInsiders />
    </RevealButton>
  )
}

export default memo(RevealInExplorer)
