import { lazy } from 'react'
import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'

const Changelog = lazy(() => import('./changelog'))

export default function useChangelog() {
  const { t } = useTranslation()

  const { showModal } = useImperativeModal({
    modalProps: {
      title: t('im.changelog'),
      keyboard: true,
    },
    FC: Changelog,
  })

  return [showModal] as const
}
