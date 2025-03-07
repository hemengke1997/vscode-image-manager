import { useTranslation } from 'react-i18next'
import { useMemoizedFn } from 'ahooks'
import useImperativeModal, { imperativeModalMap } from '../use-imperative-modal'
import ImageSearch from './image-search'

/**
 * 查找图片弹窗
 */
export default function useImageSearch() {
  const { t } = useTranslation()

  const { showModal, id } = useImperativeModal({
    modalProps: {
      title: t('im.search_image'),
      keyboard: false,
    },
    FC: ImageSearch,
  })

  const showImageSearch = useMemoizedFn(() => {
    if (imperativeModalMap.get(id)) return
    showModal({})
  })

  return [showImageSearch] as const
}
