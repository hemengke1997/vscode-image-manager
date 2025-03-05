import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'
import Settings from './settings'

export default function useSettings() {
  const { t } = useTranslation()

  const { showModal } = useImperativeModal({
    modalProps: {
      title: t('im.settings'),
      keyboard: true,
      width: 'fit-content',
      centered: true,
    },
    FC: Settings,
  })

  return [showModal] as const
}
