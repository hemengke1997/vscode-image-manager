import { useTranslation } from 'react-i18next'
import { upperFirst } from 'lodash-es'
import useImperativeModal from '../use-imperative-modal'
import ImageFilter from './image-filter'

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
    },
    FC: ImageFilter,
  })

  return [showModal] as const
}
