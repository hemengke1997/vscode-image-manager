import { memo, type PropsWithChildren } from 'react'
import { Button, Tooltip } from 'antd'

type RevealButtonProps = {
  title: string
  onClick: () => void
}

function RevealButton(props: PropsWithChildren<RevealButtonProps>) {
  const { children, onClick, title } = props

  return (
    <Tooltip arrow={false} placement={'bottom'} title={title}>
      <Button
        className={'hover:text-ant-color-primary flex h-auto cursor-pointer items-center p-1 text-lg transition-colors'}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        type='text'
      >
        {children}
      </Button>
    </Tooltip>
  )
}

export default memo(RevealButton)
