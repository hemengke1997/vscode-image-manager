import { useImperativeAntdModal } from 'ahooks-x/use-imperative-antd-modal'
import { type ModalFuncProps } from 'antd'

const Modal_Instance_Props: ModalFuncProps = {
  icon: null,
  maskClosable: false,
  keyboard: false,
  footer: null,
  width: '80%',
  destroyOnClose: true,
  closable: true,
}

const useImperativeModal: typeof useImperativeAntdModal = (args) => {
  const { id, imperativeModalMap, showModal, updateModal } = useImperativeAntdModal({
    ...args,
    modalProps: {
      ...Modal_Instance_Props,
      ...args.modalProps,
    },
  })

  return {
    showModal,
    updateModal,
    id,
    imperativeModalMap,
  }
}

export default useImperativeModal
