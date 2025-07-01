import type { PropsWithChildren } from 'react'
import { motion } from 'motion/react'
import { memo } from 'react'

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
      exit={{
        opacity: 0,
      }}
      className='flex flex-col gap-4'
    >
      {children}
    </motion.div>
  )
}

export default memo(AppearMotion)
