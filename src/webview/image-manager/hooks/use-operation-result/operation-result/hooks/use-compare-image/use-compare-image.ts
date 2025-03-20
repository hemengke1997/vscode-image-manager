import { type ModalFuncProps } from 'antd'
import useImperativeModal from '~/webview/image-manager/hooks/use-imperative-modal'
import compareImage from './compare-image'

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
    FC: compareImage,
  })

  return [showModal] as const
}
