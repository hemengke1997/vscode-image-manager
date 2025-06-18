import { upperFirst } from 'es-toolkit'
import { lazy } from 'react'
import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'

const ImageFilter = lazy(() => import('./image-filter'))

/**
 * 筛选图片弹窗
 */
export default function useImageFilter() {
  const { t } = useTranslation()
  const { showModal } = useImperativeModal({
    modalProps: {
      width: 'fit-content',
      title: upperFirst(t('im.filter')),
      keyboard: true,
      centered: true,
    },
    FC: ImageFilter,
  })

  return {
    showImageFilter: showModal,
  }
}
