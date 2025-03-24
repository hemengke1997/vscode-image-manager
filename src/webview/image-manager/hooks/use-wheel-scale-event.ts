import { type Dispatch, type SetStateAction, useRef, useState } from 'react'
import { useEventListener, useMemoizedFn, useThrottleFn } from 'ahooks'
import { clamp } from 'es-toolkit'

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
  const [isKeyPressed, setIsKeyPressed] = useState(false)

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
      if (keyborad ? isKeyPressed : true) {
        closeDefault(event)

        const delta = event.deltaY * 1

        throttleSetImageWidth((prevWidth) => {
          const newWidth = prevWidth! - delta
          return clamp(newWidth, min, max)
        })
        return false
      }
    }
  })

  const handleKeyDown = useMemoizedFn((event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      setIsKeyPressed(true)
    }
  })

  const handleKeyUp = useMemoizedFn(() => {
    setIsKeyPressed(false)
  })

  useEventListener('keydown', handleKeyDown)
  useEventListener('keyup', handleKeyUp)

  useEventListener('wheel', handleWheel, {
    passive: false,
    target: ref.current,
  })

  return [ref] as const
}
