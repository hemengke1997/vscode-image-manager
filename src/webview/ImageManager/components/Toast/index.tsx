import { useControlledState } from '@minko-fe/react-hook'
import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode, memo, useEffect, useRef } from 'react'

export type ToastProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  content?: ReactNode
  duration?: number
  onClosed?: () => void
}

function Toast(props: ToastProps) {
  const timer = useRef(0)

  const { open: openProp, onOpenChange, onClosed, content, duration = 1500 } = props

  const [open, setOpen] = useControlledState({
    defaultValue: openProp,
    value: openProp,
    onChange: onOpenChange,
  })

  useEffect(() => {
    if (open && content) {
      delayClear()
    }
    return () => {
      timer.current && clearTimeout(timer.current)
    }
  }, [open, content])

  const internalDestroy = () => {
    setOpen(false)
  }

  const beforeDestory = () => {
    internalDestroy()
  }

  const delayClear = () => {
    timer.current && clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      beforeDestory()
    }, +duration!)
  }

  const onMouseHover = (hover: boolean) => {
    if (hover) {
      timer.current && clearTimeout(timer.current)
    } else if (open && content) {
      delayClear()
    }
  }

  if (!content) return null

  return (
    <AnimatePresence mode='sync' onExitComplete={onClosed}>
      {open && (
        <motion.div
          className={
            'fixed left-1/2 top-1/2 z-[9999] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md bg-[rgba(0,0,0,.6)] px-2 py-1 text-xs shadow-sm'
          }
          initial={{
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            duration: 0.15, // props.duration is not this transition duration
          }}
          onMouseEnter={() => onMouseHover(true)}
          onMouseLeave={() => onMouseHover(false)}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
export default memo(Toast)
