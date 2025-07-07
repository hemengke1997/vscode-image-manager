import type { ModalFuncProps } from 'antd'
import type { HookAPI } from 'antd/es/modal/useModal'
import type { ComponentType, DependencyList } from 'react'
import { useDeepCompareEffect, useMemoizedFn } from 'ahooks'
import { App } from 'antd'
import { motion } from 'motion/react'
import { createElement, lazy, startTransition, useMemo, useRef } from 'react'

function isLazyComponent(component: any) {
  // @ts-expect-error typeof detection
  return component?.$$typeof === lazy(() => null).$$typeof
}

export type ImperativeModalProps = {
  closeModal: () => void
}

export const imperativeModalMap: Map<string, ReturnType<HookAPI['confirm']>> = new Map()

function randomId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36).slice(-2)
}

export type Props = {
  id?: string
  modalProps?: ModalFuncProps
  /**
   * @description modal刷新依赖
   */
  deps?: DependencyList
}

export function useImperativeAntdModal<T extends object>(
  props: Props & {
    FC: ComponentType<T>
  },
) {
  const { FC, modalProps: initialModalProps, id: idProp, deps } = props
  const { modal } = App.useApp()

  const initialModalDetails = useMemo(
    () => ({
      id: idProp || '',
      genProps: () => ({}) as any,
      instance: undefined,
      modalProps: undefined,
      componentProps: undefined,
    }),
    [idProp],
  )

  const modalDetails = useRef<{
    id: string
    genProps: (
    modalProps: ModalFuncProps | undefined,
    componentProps: Omit<T, keyof ImperativeModalProps> | undefined,
    ) => ModalFuncProps
    instance: ReturnType<HookAPI['confirm']> | undefined
    modalProps: ModalFuncProps | undefined
    componentProps: Omit<T, keyof ImperativeModalProps> | undefined
  }>(initialModalDetails)

  const onClose = useMemoizedFn((id: string) => {
    const instance = imperativeModalMap.get(id)
    instance?.destroy()
    imperativeModalMap.delete(id)
  })

  const showModal = useMemoizedFn(
    (componentProps: Omit<T, keyof ImperativeModalProps>, modalProps?: ModalFuncProps) => {
      if (imperativeModalMap.get(modalDetails.current.id)) {
        return
      }

      const id = idProp || randomId()

      const genProps = (
        modalProps: ModalFuncProps | undefined,
        componentProps: Omit<T, keyof ImperativeModalProps> | undefined,
      ): ModalFuncProps => {
        modalDetails.current = {
          ...modalDetails.current,
          modalProps: {
            ...initialModalProps,
            ...modalDetails.current.modalProps,
            ...modalProps,
          },
          componentProps: {
            ...(modalDetails.current.componentProps as Omit<T, keyof ImperativeModalProps>),
            ...componentProps,
          },
        }

        return {
          ...modalDetails.current.modalProps,
          afterClose() {
            onClose(id)
            modalDetails.current.modalProps?.afterClose?.()

            modalDetails.current = initialModalDetails
          },
          content: (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
            >
              {createElement(FC, {
                ...modalDetails.current.componentProps,
                closeModal: () => {
                  onClose(id)
                },
              } as T)}
            </motion.div>
          ),
        }
      }

      const instance = modal.confirm(genProps(modalProps, componentProps))

      modalDetails.current = {
        ...modalDetails.current,
        id,
        genProps,
        instance,
      }

      imperativeModalMap.set(id, instance)

      return {
        destroy: instance.destroy,
      }
    },
  )

  const updateModal = useMemoizedFn(
    (componentProps?: Omit<T, keyof ImperativeModalProps>, modalProps?: ModalFuncProps | undefined) => {
      if (modalDetails.current.id) {
        const instance = imperativeModalMap.get(modalDetails.current.id)
        if (!instance) {
          return
        }

        instance.update(modalDetails.current.genProps(modalProps, componentProps) || {})

        return {
          destroy: instance.destroy,
        }
      }
    },
  )

  const showModalWithLazy: typeof showModal = useMemoizedFn((...args) => {
    let result
    startTransition(() => {
      result = showModal(...args)
    })
    return result
  })

  const mounted = useRef(false)
  useDeepCompareEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }

    if (modalDetails.current.id) {
      const instance = imperativeModalMap.get(modalDetails.current.id)
      instance?.update(modalDetails.current.genProps(initialModalProps, undefined) || {})
    }
  }, [...(deps || []), initialModalProps])

  return {
    showModal: isLazyComponent(FC) ? showModalWithLazy : showModal,
    updateModal,
    id: modalDetails.current.id,
    imperativeModalMap,
  }
}
