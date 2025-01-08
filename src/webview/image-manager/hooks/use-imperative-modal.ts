import { createElement, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { App, type ModalFuncProps } from 'antd'
import { nanoid } from 'nanoid'

const Modal_Instance_Props: ModalFuncProps = {
  icon: null,
  maskClosable: false,
  keyboard: false,
  footer: null,
  width: '80%',
  destroyOnClose: true,
  closable: true,
}

export type ImperativeModalProps = {
  onClose: () => void
}

export default function useImperativeModal<T extends ImperativeModalProps>(props: {
  FC: React.ComponentType<T>
  modalProps: ModalFuncProps
}) {
  const { FC, modalProps } = props
  const { modal } = App.useApp()

  const modalMap = useRef<Map<string, ReturnType<typeof modal.confirm>>>(new Map())

  const onClose = useMemoizedFn((id: string) => {
    modalMap.current.delete(id)
  })

  const showModal = useMemoizedFn((runtimeProps: Omit<T, 'onClose'>, runtimeModalProps?: ModalFuncProps) => {
    const id = nanoid()
    const instance = modal.confirm({
      ...Modal_Instance_Props,
      ...modalProps,
      ...runtimeModalProps,
      afterClose() {
        onClose(id)
        modalProps.afterClose?.()
      },
      content: createElement(FC, {
        ...runtimeProps,
        onClose: () => {
          const instance = modalMap.current.get(id)
          instance?.destroy()
          onClose(id)
        },
      } as T),
    })

    modalMap.current.set(id, instance)

    return instance
  })

  const { i18n } = useTranslation()
  useUpdateEffect(() => {
    for (const instance of modalMap.current.values()) {
      instance.update(modalProps)
    }
  }, [i18n.language])

  return {
    showModal,
    modalMap,
  }
}
