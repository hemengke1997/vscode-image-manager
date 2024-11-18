import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'
import RenameImage from './rename-image'

/**
 * 重命名图片弹窗
 */
export default function useRenameImage() {
  const { t } = useTranslation()

  const { showModal } = useImperativeModal({
    modalProps: {
      width: 400,
      title: t('im.rename'),
      centered: true,
      keyboard: true,
    },
    FC: RenameImage,
  })

  return [showModal] as const
}
