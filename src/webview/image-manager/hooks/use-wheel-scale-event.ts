import { type Dispatch, type SetStateAction, useLayoutEffect, useRef } from 'react'
import { useMemoizedFn, useThrottleFn } from 'ahooks'
import { clamp, round } from 'es-toolkit'

type Props = {
  setImageWidth: Dispatch<SetStateAction<number>>
  beforeScale?: (container: HTMLDivElement | null) => boolean
  /**
   * 最小缩放值
   */
  min: number
  /**
   * 最大缩放值
   */
  max: number
  /**
   * 是否需要按住ctrl/command键才能缩放
   */
  keyborad?: boolean
}

/**
 * 监听鼠标滚轮事件，缩放图片大小
 */
export default function useWheelScaleEvent(props: Props) {
  const { setImageWidth, min, max, beforeScale = () => true, keyborad = true } = props

  const ref = useRef<HTMLDivElement>(null)

  const closeDefault = useMemoizedFn((e: Event) => {
    if (e.preventDefault) {
      e.preventDefault()
      e.stopPropagation()
    }
  })

  const { run: throttleSetImageWidth } = useThrottleFn(setImageWidth, {
    wait: 60,
  })

  const handleWheel = useMemoizedFn((event: WheelEvent) => {
    if (beforeScale(ref.current)) {
      if (keyborad ? event.ctrlKey || event.metaKey : true) {
        closeDefault(event)

        requestAnimationFrame(() => {
          const delta = event.deltaY * 1

          throttleSetImageWidth((prevWidth) => {
            const newWidth = prevWidth! - delta
            return clamp(round(newWidth, 0), min, max)
          })
        })
        return false
      }
    }
  })

  useLayoutEffect(() => {
    ref.current?.addEventListener('wheel', handleWheel, { passive: false })
    return () => ref?.current?.removeEventListener('wheel', handleWheel)
  }, [])

  return [ref] as const
}
