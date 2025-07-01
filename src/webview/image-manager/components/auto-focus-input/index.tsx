import type { GetProps, InputRef } from 'antd'
import { Input } from 'antd'
import { memo, useLayoutEffect, useRef } from 'react'

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
