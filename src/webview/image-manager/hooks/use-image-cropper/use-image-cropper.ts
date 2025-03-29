import { lazy } from 'react'
import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'

const ImageCropper = lazy(() => import('./image-cropper'))

/**
 * 裁剪图片的弹窗
 */
export default function useImageCropper() {
  const { t } = useTranslation()

  const { showModal } = useImperativeModal({
    modalProps: {
      title: t('im.crop'),
    },
    FC: ImageCropper,
  })

  return [showModal] as const
}
