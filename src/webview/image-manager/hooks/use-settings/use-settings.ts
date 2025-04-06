import { lazy } from 'react'
import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'

const Settings = lazy(() => import('./settings'))

export default function useSettings() {
  const { t } = useTranslation()

  const { showModal } = useImperativeModal({
    modalProps: {
      title: t('im.settings'),
      keyboard: true,
      width: 'fit-content',
      style: {
        minWidth: '30%',
      },
      centered: true,
    },
    FC: Settings,
  })

  return [showModal] as const
}
