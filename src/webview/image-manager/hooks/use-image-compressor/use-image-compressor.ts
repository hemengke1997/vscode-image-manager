import { lazy } from 'react'
import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'

const ImageCompressor = lazy(() => import('./image-compressor'))

/**
 * 图片压缩的弹窗
 */
export default function useImageCompressor() {
  const { t } = useTranslation()

  const { showModal } = useImperativeModal({
    modalProps: {
      title: t('im.image_compression'),
    },
    FC: ImageCompressor,
  })

  return [showModal] as const
}
