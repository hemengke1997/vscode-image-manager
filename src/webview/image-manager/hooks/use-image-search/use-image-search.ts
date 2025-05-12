import { lazy } from 'react'
import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'

const ImageSearch = lazy(() => import('./image-search'))

/**
 * 查找图片弹窗
 */
export default function useImageSearch() {
  const { t } = useTranslation()

  const { showModal, id, imperativeModalMap } = useImperativeModal({
    modalProps: {
      title: t('im.search_image'),
      keyboard: false,
    },
    FC: ImageSearch,
  })

  return {
    showImageSearch: showModal,
    id,
    imperativeModalMap,
  }
}
