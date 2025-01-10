import { imperativeModalMap, type ImperativeModalProps, useImperativeAntdModal } from 'ahooks-x'
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

export { imperativeModalMap, type ImperativeModalProps }

const useImperativeModal: typeof useImperativeAntdModal = (args) => {
  return useImperativeAntdModal({
    ...args,
    modalProps: {
      ...Modal_Instance_Props,
      ...args.modalProps,
    },
  })
}

export default useImperativeModal
