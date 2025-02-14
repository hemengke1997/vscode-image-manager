import { memo, type ReactNode, useMemo } from 'react'
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

  const positions = useMemo(
    () => [
      { className: 'left-0 top-0 translate-x-[-40%] translate-y-[-40%]', content: leftTop },
      { className: 'right-0 top-0 translate-x-[40%] translate-y-[-40%]', content: rightTop },
      { className: 'bottom-0 left-0 translate-x-[-40%] translate-y-[40%]', content: leftBottom },
      { className: 'bottom-0 right-0 translate-x-[40%] translate-y-[40%]', content: rightBottom },
    ],
    [leftTop, rightTop, leftBottom, rightBottom],
  )

  return (
    <div className={classNames('relative text-ant-color-text', className)}>
      {positions.map(({ className, content }, index) => (
        <div key={index} className={classNames('absolute z-[1]', className)}>
          {content}
        </div>
      ))}
      {children}
    </div>
  )
}

export default memo(Corner)
