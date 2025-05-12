import { lazy } from 'react'
import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'

const RenameImages = lazy(() => import('./rename-images'))

/**
 * 重命名多个图片弹窗
 */
export default function useRenameImages() {
  const { t } = useTranslation()

  const { showModal } = useImperativeModal({
    modalProps: {
      width: 500,
      title: t('im.rename'),
      centered: true,
      keyboard: true,
    },
    FC: RenameImages,
  })

  return {
    showRenameImages: showModal,
  }
}
