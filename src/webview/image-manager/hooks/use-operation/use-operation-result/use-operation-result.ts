import { lazy } from 'react'
import { useTranslation } from 'react-i18next'
import { type ModalFuncProps } from 'antd'
import useImperativeModal from '../../use-imperative-modal'

const OperationResult = lazy(() => import('./operation-result'))

/**
 * 查看操作结果的弹窗
 */
export default function useOperationResult(modalProps: ModalFuncProps) {
  const { t } = useTranslation()

  const { showModal } = useImperativeModal({
    modalProps: {
      title: t('im.result_of_handling'),
      ...modalProps,
    },
    FC: OperationResult,
  })

  return [showModal] as const
}
