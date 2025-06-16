import { memo, useEffect, useRef, useState } from 'react'
import { TbCopy, TbCopyCheck } from 'react-icons/tb'
import { useMemoizedFn } from 'ahooks'
import { Button } from 'antd'
import { classNames } from 'tw-clsx'

type Props = {
  children: string
}

function WithCopy(props: Props) {
  const { children } = props

  const [copied, setCopied] = useState(false)

  const timeoutRef = useRef<number | null>()

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  return (
    <div className={'group flex items-center gap-1'}>
      {children}
      <Button
        className={'opacity-0 transition-opacity delay-100 group-hover:opacity-100'}
        classNames={{
          icon: classNames('transition-colors', copied && 'text-ant-color-success'),
        }}
        icon={copied ? <TbCopyCheck /> : <TbCopy />}
        onClick={useMemoizedFn(() => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }

          navigator.clipboard.writeText(children)

          setCopied(true)
          timeoutRef.current = window.setTimeout(() => {
            setCopied(false)
            timeoutRef.current = null
          }, 3000)
        })}
        type={'text'}
      ></Button>
    </div>
  )
}

export default memo(WithCopy)
