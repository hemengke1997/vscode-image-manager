import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'
import DeleteImage from './delete-image'

/**
 * 删除图片弹窗
 */
export default function useDeleteImage() {
  const { t } = useTranslation()
  const { showModal } = useImperativeModal({
    modalProps: {
      width: 400,
      title: t('im.delete'),
      centered: true,
      keyboard: true,
      icon: undefined,
    },
    FC: DeleteImage,
  })

  return [showModal] as const
}
