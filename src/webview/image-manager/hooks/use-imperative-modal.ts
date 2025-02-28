import {
  imperativeModalMap,
  type ImperativeModalProps,
  useImperativeAntdModal,
} from 'ahooks-x/use-imperative-antd-modal'
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
  const { id, imperativeModalMap, showModal } = useImperativeAntdModal({
    ...args,
    modalProps: {
      ...Modal_Instance_Props,
      ...args.modalProps,
    },
  })

  const _showModal: typeof showModal = (...args) => {
    if (imperativeModalMap.get(id)) {
      // 避免重复打开弹窗
      return {} as ReturnType<typeof showModal>
    }
    return showModal(...args)
  }

  return {
    showModal: _showModal,
    id,
    imperativeModalMap,
  }
}

export default useImperativeModal
