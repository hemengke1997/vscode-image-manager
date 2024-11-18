import { useTranslation } from 'react-i18next'
import { type ModalFuncProps } from 'antd'
import useImperativeModal from '../use-imperative-modal'
import OperatorResult from './operator-result'

/**
 * 查看操作结果的弹窗
 */
export default function useImageOperatorResult(modalProps: ModalFuncProps) {
  const { t } = useTranslation()

  const { showModal } = useImperativeModal({
    modalProps: {
      title: t('im.result_of_handling'),
      ...modalProps,
    },
    FC: OperatorResult,
  })

  return [showModal] as const
}
