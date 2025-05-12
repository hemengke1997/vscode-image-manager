import { lazy } from 'react'
import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'

const ImageDetails = lazy(() => import('./image-details'))

/**
 * 图片详情弹窗
 */
export default function useImageDetails() {
  const { t } = useTranslation()

  const { showModal } = useImperativeModal({
    id: 'image-details',
    modalProps: {
      title: t('im.image_detail'),
      width: 500,
      centered: true,
      keyboard: true,
    },
    FC: ImageDetails,
  })

  return {
    showImageDetails: showModal,
  }
}
