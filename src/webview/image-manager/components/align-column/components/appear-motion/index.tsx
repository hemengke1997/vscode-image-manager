import { memo, type PropsWithChildren } from 'react'
import { motion } from 'motion/react'
import { ANIMATION_DURATION } from '~/webview/image-manager/utils/duration'

function AppearMotion(props: PropsWithChildren) {
  const { children } = props

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: ANIMATION_DURATION.middle,
        delay: ANIMATION_DURATION.fast,
      }}
    >
      <div className={'flex flex-col gap-4'}>{children}</div>
    </motion.div>
  )
}

export default memo(AppearMotion)
