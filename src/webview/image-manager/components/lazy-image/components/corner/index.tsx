import { memo, type ReactNode } from 'react'
import { classNames } from 'tw-clsx'

type Props = {
  children: ReactNode
  leftTop?: ReactNode
  rightTop?: ReactNode
  leftBottom?: ReactNode
  rightBottom?: ReactNode
  className?: string
}

function Corner(props: Props) {
  const { children, className, leftBottom, leftTop, rightBottom, rightTop } = props

  return (
    <div className={classNames('text-ant-color-text relative', className)}>
      <div className={'absolute left-0 top-0 z-[1] flex translate-x-[-30%] translate-y-[-30%]'}>{leftTop}</div>
      <div className={'absolute right-0 top-0 z-[1] flex translate-x-[30%] translate-y-[-30%]'}>{rightTop}</div>
      <div className={'absolute bottom-0 left-0 z-[1] flex translate-x-[-30%] translate-y-[30%]'}>{leftBottom}</div>
      <div className={'absolute bottom-0 right-0 z-[1] flex translate-x-[30%] translate-y-[30%]'}>{rightBottom}</div>
      {children}
    </div>
  )
}

export default memo(Corner)
