import { memo, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { type OperatorResult } from '~/core'
import { ANIMATION_DURATION } from '~/webview/image-manager/utils/duration'

function CollapseContent(props: { results: OperatorResult[]; children: (item: OperatorResult) => ReactNode }) {
  const { results, children } = props

  return (
    <div className={'flex flex-wrap gap-2'}>
      <AnimatePresence>
        {results.map((item) => (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: ANIMATION_DURATION.fast }}
            key={item.id}
          >
            {children(item)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default memo(CollapseContent)
