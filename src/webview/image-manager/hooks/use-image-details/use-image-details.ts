import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'
import ImageDetails from './image-details'
import styles from './index.module.css'

/**
 * 图片详情弹窗
 */
export default function useImageDetails() {
  const { t } = useTranslation()

  const { showModal } = useImperativeModal({
    modalProps: {
      title: t('im.image_detail'),
      width: 500,
      className: styles.detail_modal,
      centered: true,
      keyboard: true,
    },
    FC: ImageDetails,
  })

  return [showModal] as const
}
