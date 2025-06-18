import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import toast, { resolveValue, useToaster, useToasterStore } from 'react-hot-toast'
import { ANIMATION_DURATION } from '../../utils/duration'
import { classNames } from '../../utils/tw-clsx'
import { PreventClickAway } from '../viewer/hooks/use-click-image-away'
import './index.css'

function useMaxToasts(max: number) {
  const { toasts } = useToasterStore()

  useEffect(() => {
    toasts
      .filter(t => t.visible) // Only consider visible toasts
      .filter((_, i) => i >= max) // Is toast index over limit?
      .forEach(t => toast.dismiss(t.id)) // Dismiss – Use toast.remove(t.id) for no exit animation
  }, [toasts, max])
}

export function ToasterWithMax({
  max = 1,
}: {
  max?: number
}) {
  useMaxToasts(max)

  const { toasts, handlers } = useToaster({
    duration: ANIMATION_DURATION.middle * 1000,
  })

  return (
    <div
      style={{
        zIndex: 9999,
      }}
      className='fixed left-1/2 top-1/2 -translate-y-1/2 '
      onMouseEnter={handlers.startPause}
      onMouseLeave={handlers.endPause}
    >
      <AnimatePresence>
        {toasts.map((t) => {
          return (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
              }}
              transition={{
                type: 'spring',
                duration: ANIMATION_DURATION.middle,
              }}
              key={t.id}
              className={classNames(
                'flex items-center justify-center px-2 py-1 text-sm shadow-sm text-white rounded-md bg-black/60',
                PreventClickAway.Viewer,
              )}
            >
              {resolveValue(t.message, t)}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
