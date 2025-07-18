import type { ButtonProps } from 'antd'
import { useTimeout } from 'ahooks'
import { Button } from 'antd'
import { memo, useRef } from 'react'

function AutoFocusButton(props: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)

  useTimeout(() => {
    ref.current?.focus()
  }, 16)

  return <Button ref={ref} {...props} />
}

export default memo(AutoFocusButton)
