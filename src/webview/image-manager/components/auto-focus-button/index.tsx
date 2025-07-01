import type { ButtonProps } from 'antd'
import { Button } from 'antd'
import { memo, useLayoutEffect, useRef } from 'react'

function AutoFocusButton(props: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    timeoutId = setTimeout(() => {
      ref.current?.focus()
    })
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  return <Button ref={ref} {...props} />
}

export default memo(AutoFocusButton)
