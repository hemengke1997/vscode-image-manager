import { useMemoizedFn } from 'ahooks'
import { type ReactNode, useRef } from 'react'
import { toast as simpleToast, type Toast, type ToastOptions } from 'react-simple-toasts'
import { type ToastUpdateOptions } from 'react-simple-toasts/dist/type/common'

const commonToastOptions: ToastOptions = {
  duration: 2000,
  maxVisibleToasts: 1,
  position: 'center',
  clickClosable: false,
  zIndex: 9999,
  render(message) {
    return (
      <div
        className={
          'pointer-events-none flex items-center justify-center rounded-md bg-[rgba(0,0,0,0.6)] px-2 py-1 text-sm shadow-sm'
        }
      >
        {message}
      </div>
    )
  },
}

export default function useSingleToast() {
  const toastRef = useRef<Toast>()

  const toast = useMemoizedFn((options: { message: ReactNode } & (ToastOptions & ToastUpdateOptions)) => {
    const { message, onClose, duration, ...rest } = options

    if (toastRef.current) {
      toastRef.current.update({
        message,
        ...commonToastOptions,
        ...rest,
      } as ToastUpdateOptions)
    } else {
      toastRef.current = simpleToast(message, {
        ...commonToastOptions,
        ...rest,
        onClose() {
          toastRef.current = undefined
          onClose?.()
        },
      })
    }
  })

  const clearToast = () => {
    toastRef.current?.close()
    toastRef.current = undefined
  }

  return {
    toast,
    clearToast,
  }
}
