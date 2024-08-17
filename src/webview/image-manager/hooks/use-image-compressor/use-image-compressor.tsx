import { useTranslation } from 'react-i18next'
import { useImperativeModal } from '../use-imperative-modal'
import ImageCompressor from './image-compressor'

/**
 * 图片压缩的弹窗
 */
export function useImageCompressor() {
  const { t } = useTranslation()

  const { showModal } = useImperativeModal({
    modalProps: {
      title: t('im.image_compression'),
    },
    FC: ImageCompressor,
  })

  return [showModal] as const
}
