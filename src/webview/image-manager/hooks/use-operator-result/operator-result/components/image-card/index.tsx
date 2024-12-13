import { memo, type PropsWithChildren } from 'react'
import { Card, type GetProps } from 'antd'
import { AnimatePresence, motion } from 'motion/react'
import { classNames } from 'tw-clsx'
import GlobalContext from '~/webview/image-manager/contexts/global-context'
import { ANIMATION_DURATION } from '~/webview/image-manager/utils/duration'
import styles from './index.module.css'

function ImageCard(props: PropsWithChildren<GetProps<typeof Card>>) {
  const { imageWidth } = GlobalContext.usePicker(['imageWidth'])
  const { children, ...rest } = props
  return (
    <Card {...rest} className={classNames('w-fit', styles.card)} style={{ width: imageWidth + 16 }}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: ANIMATION_DURATION.fast }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </Card>
  )
}

export default memo(ImageCard)
