import { Button, Tooltip } from 'antd'
import { motion } from 'motion/react'
import { memo } from 'react'
import { BsQuestionCircleFill } from 'react-icons/bs'
import { classNames } from '~/webview/image-manager/utils/tw-clsx'

type Props = {
  image: string
  className?: string
}

function Preview(props: Props) {
  const { image, className } = props

  return (
    <Tooltip
      title={(
        <img
          src={image}
          className={classNames(
            'rounded-ant-border-radius border border-solid border-ant-color-border object-contain',
            className,
          )}
        />
      )}
      styles={{
        body: {
          padding: 0,
          backgroundColor: 'transparent',
        },
      }}
      arrow={false}
      placement='right'
    >
      <Button
        type='text'
        icon={(
          <motion.div
            className='flex items-center'
            initial={false}
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              repeat: 1,
              duration: 0.2,
            }}
            key={image}
          >
            <BsQuestionCircleFill />
          </motion.div>
        )}
      >
      </Button>
    </Tooltip>
  )
}

export default memo(Preview)
