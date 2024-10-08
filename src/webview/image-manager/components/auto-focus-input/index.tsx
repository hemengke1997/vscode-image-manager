import { memo, useLayoutEffect, useRef } from 'react'
import { type GetProps, Input, type InputRef } from 'antd'

function AutoFocusInput(props: GetProps<typeof Input>) {
  const ref = useRef<InputRef>(null)
  useLayoutEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    timeoutId = setTimeout(() => {
      ref.current?.focus({ cursor: 'all' })
    })
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  return <Input ref={ref} {...props}></Input>
}

export default memo(AutoFocusInput)
