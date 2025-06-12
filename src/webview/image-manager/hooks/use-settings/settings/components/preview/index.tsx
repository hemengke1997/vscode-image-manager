import { memo } from 'react'
import { BsQuestionCircleFill } from 'react-icons/bs'
import { Button, Tooltip } from 'antd'
import { classNames } from 'tw-clsx'

type Props = {
  image: string
  className?: string
}

function Preview(props: Props) {
  const { image, className } = props
  return (
    <Tooltip
      title={
        <img
          src={image}
          className={classNames(
            'rounded-ant-border-radius border border-solid border-ant-color-border object-contain',
            className,
          )}
        />
      }
      styles={{
        body: {
          padding: 0,
          backgroundColor: 'transparent',
        },
      }}
      arrow={false}
      placement={'bottom'}
    >
      <Button type='text' icon={<BsQuestionCircleFill />}></Button>
    </Tooltip>
  )
}

export default memo(Preview)
