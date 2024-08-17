import { round } from '@minko-fe/lodash-pro'
import { useThrottleFn } from '@minko-fe/react-hook'
import { useLayoutEffect, useRef } from 'react'
import GlobalContext from '../contexts/global-context'

/**
 * 监听鼠标滚轮事件，缩放 viewer 中的图片大小
 */
function useWheelScaleEvent() {
  const { setImageWidth } = GlobalContext.usePicker(['setImageWidth'])

  const ref = useRef<HTMLDivElement>(null)

  const closeDefault = (e: Event) => {
    if (e.preventDefault) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const { run: throttleSetImageWidth } = useThrottleFn(setImageWidth, {
    wait: 100,
  })

  const handleWheel = (event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      closeDefault(event)

      const delta = event.deltaY

      const maxDelta = Math.abs(delta)

      if (delta > 0) {
        // 缩小
        throttleSetImageWidth((prevWidth) => Math.max(30, round(prevWidth! - maxDelta, 0)))
      } else if (delta < 0) {
        // 放大
        throttleSetImageWidth((prevWidth) => Math.min(600, round(prevWidth! + maxDelta, 0)))
      }
      return false
    }
  }

  useLayoutEffect(() => {
    ref.current?.addEventListener('wheel', handleWheel, { passive: false })
    return () => ref?.current?.removeEventListener('wheel', handleWheel)
  }, [])

  return [ref] as const
}

export default useWheelScaleEvent
