import { lazy } from 'react'
import { type ModalFuncProps } from 'antd'
import useImperativeModal from '~/webview/image-manager/hooks/use-imperative-modal'

const CompareImage = lazy(() => import('./compare-image'))

export default function useCompareImage(modalProps?: ModalFuncProps) {
  const { showModal } = useImperativeModal({
    modalProps: {
      centered: true,
      className: '!invisible',
      keyboard: true,
      mask: false,
      width: '100%',
      ...modalProps,
    },
    FC: CompareImage,
  })

  return [showModal] as const
}
