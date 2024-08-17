import { useTranslation } from 'react-i18next'
import { useImperativeModal } from '../use-imperative-modal'
import imageCropper from './image-cropper'

/**
 * 裁剪图片的弹窗
 */
export function useImageCropper() {
  const { t } = useTranslation()

  const { showModal } = useImperativeModal({
    FC: imageCropper,
    modalProps: {
      title: t('im.crop'),
    },
  })

  return [showModal] as const
}
