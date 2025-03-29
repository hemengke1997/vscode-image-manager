import { type Dispatch, type SetStateAction, useRef } from 'react'
import { useEventListener, useKeyPress, useMemoizedFn, useThrottleFn } from 'ahooks'
import { clamp } from 'es-toolkit'
import { Key } from 'ts-key-enum'

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
  /**
   * 缩放步长
   */
  scaleStep?: number
}

/**
 * 监听鼠标滚轮事件，缩放图片大小
 */
export default function useWheelScaleEvent(props: Props) {
  const { setImageWidth, min, max, beforeScale = () => true, keyborad = true, scaleStep = 1 } = props

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

  const isKeyboardEvent = useMemoizedFn((event: WheelEvent | KeyboardEvent) => {
    return event.ctrlKey || event.metaKey
  })

  const isKeyPressed = useRef(false)
  const isScrolling = useRef<boolean>(false)
  const scrollTimeout = useRef<number>()

  const onWheel = useMemoizedFn((event: WheelEvent, condition: boolean) => {
    const shouldWheel = beforeScale(ref.current)
    if (shouldWheel && condition) {
      closeDefault(event)
      const delta = event.deltaY * scaleStep

      throttleSetImageWidth((prevWidth) => {
        const newWidth = prevWidth! - delta
        return clamp(newWidth, min, max)
      })
    }
  })

  const handleWheel = useMemoizedFn((event: WheelEvent) => {
    if (keyborad) {
      // 如果开启了keyboard，要处理惯性滚动的情况
      // 这里使用定时器来判断是否是惯性滚动
      isScrolling.current = true
      onWheel(event, isKeyPressed.current && isKeyboardEvent(event))
      if (scrollTimeout.current) window.clearTimeout(scrollTimeout.current)
      scrollTimeout.current = window.setTimeout(() => {
        isScrolling.current = false
      }, 200)
    } else {
      onWheel(event, true)
    }
  })

  useKeyPress(
    // 开启keyboard的情况下，处理相关逻辑
    (e) => keyborad && [Key.Control, Key.Meta].includes(e.key as Key),
    (event) => {
      if (event.type === 'keydown') {
        isKeyPressed.current = !isScrolling.current
      } else if (event.type === 'keyup') {
        isKeyPressed.current = false
      }
    },
    {
      events: ['keydown', 'keyup'],
    },
  )

  useEventListener('wheel', handleWheel, {
    passive: false,
    target: ref.current,
  })

  return [ref] as const
}
