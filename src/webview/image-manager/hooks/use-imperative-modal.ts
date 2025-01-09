import { createElement, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { App, type ModalFuncProps } from 'antd'
import { type HookAPI } from 'antd/es/modal/useModal'
import { nanoid } from 'nanoid'

const Modal_Instance_Props: ModalFuncProps = {
  icon: null,
  maskClosable: false,
  keyboard: false,
  footer: null,
  width: '80%',
  destroyOnClose: false,
  closable: true,
}

export type ImperativeModalProps = {
  onClose: () => void
}

export const imperativeModalMap: Map<string, ReturnType<HookAPI['confirm']>> = new Map()

export default function useImperativeModal<T extends ImperativeModalProps>(props: {
  id?: string
  FC: React.ComponentType<T>
  modalProps: ModalFuncProps
}) {
  const { FC, modalProps, id: idProp } = props
  const { modal } = App.useApp()

  const [currentID, setCurrentID] = useState<string>(idProp || nanoid())

  const onClose = useMemoizedFn((id: string) => {
    imperativeModalMap.delete(id)
  })

  const showModal = useMemoizedFn((runtimeProps: Omit<T, 'onClose'>, runtimeModalProps?: ModalFuncProps) => {
    const id = idProp || nanoid()
    setCurrentID(id)
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
          const instance = imperativeModalMap.get(id)
          instance?.destroy()
          onClose(id)
        },
      } as T),
    })

    imperativeModalMap.set(id, instance)

    return instance
  })

  const { i18n } = useTranslation()
  useUpdateEffect(() => {
    for (const instance of imperativeModalMap.values()) {
      instance.update(modalProps)
    }
  }, [i18n.language])

  return {
    showModal,
    id: currentID,
  }
}
