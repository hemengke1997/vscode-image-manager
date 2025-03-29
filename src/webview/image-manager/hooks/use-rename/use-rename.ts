import { lazy } from 'react'
import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'

const Rename = lazy(() => import('./rename'))

/**
 * 重命名单个图片/目录弹窗
 */
export default function useRename() {
  const { t } = useTranslation()

  const { showModal } = useImperativeModal({
    modalProps: {
      width: 400,
      title: t('im.rename'),
      centered: true,
      keyboard: true,
    },
    FC: Rename,
  })

  return [showModal] as const
}
