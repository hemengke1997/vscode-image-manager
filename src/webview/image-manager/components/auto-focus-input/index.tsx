import { type GetProps, Input, type InputRef } from 'antd'
import { memo, useLayoutEffect, useRef } from 'react'

function AutoFocusInput(props: GetProps<typeof Input>) {
  const ref = useRef<InputRef>(null)
  useLayoutEffect(() => {
    if (ref.current) {
      setTimeout(() => {
        ref.current?.focus({ cursor: 'all' })
      })
    }
  }, [ref])
  return <Input ref={ref} {...props}></Input>
}

export default memo(AutoFocusInput)
