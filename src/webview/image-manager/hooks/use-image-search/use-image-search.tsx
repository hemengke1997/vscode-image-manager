import { useMemoizedFn } from 'ahooks'
import { useTranslation } from 'react-i18next'
import useImperativeModal from '../use-imperative-modal'
import ImageSearch from './image-search'

/**
 * 查找图片弹窗
 */
export default function useImageSearch() {
  const { t } = useTranslation()

  const { showModal, modalMap } = useImperativeModal({
    modalProps: {
      title: t('im.search_image'),
    },
    FC: ImageSearch,
  })

  const showImageSearch = useMemoizedFn(() => {
    if (modalMap.current.size) return
    showModal({})
  })

  return [showImageSearch] as const
}
