import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'
import ImageSimilarity from './image-similarity'

/**
 * 查看相似图片的弹窗
 */
export default function useImageSimilarity() {
  const { t } = useTranslation()

  const { showModal } = useImperativeModal({
    modalProps: {
      title: t('im.find_similar_images'),
    },
    FC: ImageSimilarity,
  })

  return [showModal] as const
}
