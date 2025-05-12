import { lazy, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'

const ImageSimilarity = lazy(() => import('./image-similarity'))

/**
 * 查看相似图片的弹窗
 */
export default function useImageSimilarity() {
  const { t } = useTranslation()

  const { showModal, id, imperativeModalMap } = useImperativeModal({
    modalProps: {
      title: t('im.find_similar_images'),
    },
    FC: ImageSimilarity,
  })

  const isOpened = useMemo(() => {
    return imperativeModalMap.has(id)
  }, [imperativeModalMap, id])

  return {
    showImageSimilarity: showModal,
    isOpened,
  }
}
