import { useControlledState, useMemoizedFn } from '@minko-fe/react-hook'
import { AnimatePresence, motion } from 'framer-motion'
import { type ReactElement, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { Emitter } from 'strict-event-emitter'
import { ANIMATION_DURATION } from '../../utils/duration'
import Queue, { type ToastMessageType } from './queue'

export type ToastProps = {
  content?: ReactNode
  duration?: number
  onClosed?: () => void
}

function useMergeProps<T>(props: T, updatedProps: T) {
  const [mergedProps, setMergedProps] = useState<T>(props)
  useEffect(() => {
    setMergedProps((prev) => ({ ...prev, ...updatedProps }))
  }, [updatedProps])
  return mergedProps
}

function ToastHolder(props: ToastProps) {
  const timer = useRef(0)

  const [updatedProps, setUpdatedProps] = useState<ToastProps>()
  const mergedProps = useMergeProps(props, updatedProps)

  const { onClosed, content, duration = 1500 } = mergedProps || {}

  const [open, setOpen] = useControlledState({
    defaultValue: true,
  })

  useLayoutEffect(() => {
    event.on('destroy', internalDestroy)
    event.on('update', setUpdatedProps)
    return () => {
      event.off('destroy', internalDestroy)
      event.off('update', setUpdatedProps)
    }
  }, [])

  useEffect(() => {
    if (open && content) {
      delayClear()
    }
    return () => {
      timer.current && clearTimeout(timer.current)
      timer.current = 0
    }
  }, [updatedProps])

  const internalDestroy = useMemoizedFn(() => {
    setOpen(false)
  })

  const beforeDestory = useMemoizedFn(() => {
    internalDestroy()
  })

  const delayClear = useMemoizedFn(() => {
    timer.current && clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      beforeDestory()
    }, +duration!)
  })

  const onMouseHover = useMemoizedFn((hover: boolean) => {
    if (!open) return
    if (hover) {
      timer.current && clearTimeout(timer.current)
    } else if (open && content) {
      delayClear()
    }
  })

  if (!content) return null

  return (
    <AnimatePresence onExitComplete={onClosed}>
      {open && (
        <motion.div
          className={
            'fixed left-1/2 top-1/2 z-[9999] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md bg-[rgba(0,0,0,0.6)] px-2 py-1 text-sm shadow-sm'
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
            duration: ANIMATION_DURATION.fast, // props.duration is not this transition duration
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

const queue = new Queue()
const event = new Emitter<{
  init: [message: ToastMessageType]
  update: [message: ToastMessageType]
  destroy: []
}>()

const MARK = '__toast_react_root__'

type ContainerType = (Element | DocumentFragment) & {
  [MARK]?: Root
}

async function concurrentUnmount(container: ContainerType) {
  // Delay to unmount to avoid React 18 sync warning
  return Promise.resolve().then(() => {
    container[MARK]?.unmount()
    delete container[MARK]
  })
}

function reactRender(node: ReactElement, container: ContainerType) {
  const root = container[MARK] || createRoot(container)
  root.render(node)
  container[MARK] = root
}

event.on('init', (args) => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  reactRender(
    <ToastHolder
      {...args}
      onClosed={() => {
        concurrentUnmount(container)
        container.remove()
        args.onClosed?.()
        queue.shift()
      }}
    />,
    container,
  )
})

function notice(props: ToastProps) {
  queue.push(props)
  if (queue.length === 1) {
    event.emit('init', queue.first)
    return
  } else {
    queue.shift()
    event.emit('update', queue.first)
  }
}

const Toast = {
  open: (props: ToastProps) => {
    notice(props)
  },
  hide: () => {
    if (queue.length) {
      event.emit('destroy')
    }
  },
}

export default Toast
