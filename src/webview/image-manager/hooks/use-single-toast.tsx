import { useRef } from 'react'
import { type Toast, type ToastOptions } from 'react-simple-toasts'

const _commonToastOptions: ToastOptions = {
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

  const clearToast = () => {
    toastRef.current?.close()
    toastRef.current = undefined
  }

  return {
    clearToast,
  }
}
