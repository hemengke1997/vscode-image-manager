import { lazy } from 'react'
import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'

const ImageConverter = lazy(() => import('./image-converter'))

/**
 * 转化图片格式的弹窗
 */
export default function useImageConverter() {
  const { t } = useTranslation()

  const { showModal } = useImperativeModal({
    modalProps: {
      title: t('im.convert_format'),
    },
    FC: ImageConverter,
  })

  return {
    showImageConverter: showModal,
  }
}
