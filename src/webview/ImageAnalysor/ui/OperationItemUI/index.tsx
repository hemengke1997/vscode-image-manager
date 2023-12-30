import { type ReactNode, memo } from 'react'

type OperationItemProps = {
  children: ReactNode
  title: ReactNode
}

function OperationItemUI(props: OperationItemProps) {
  const { children, title } = props
  return (
    <div className={'flex items-center space-x-4'}>
      <div className={'font-semibold'}>{title}</div>
      {children}
    </div>
  )
}

export default memo(OperationItemUI)
