import type { GetProps, InputRef } from 'antd'
import { useTimeout } from 'ahooks'
import { Input } from 'antd'
import { memo, useRef } from 'react'

function AutoFocusInput(props: GetProps<typeof Input>) {
  const ref = useRef<InputRef>(null)

  useTimeout(() => {
    ref.current?.focus({ cursor: 'all' })
  }, 16)

  return <Input ref={ref} {...props}></Input>
}

export default memo(AutoFocusInput)
