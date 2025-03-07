import { useEffect, useRef } from 'react'
import { useEventListener, useInViewport, useMemoizedFn, useUpdateEffect } from 'ahooks'
import { isUndefined } from 'lodash-es'
import { getAppRoot } from '~/webview/utils'

type Props = {
  /**
   * 需要sticky的元素
   */
  target: HTMLElement | null
  /**
   * sticky外层容器
   */
  holder?: HTMLElement | null
  /**
   * sticky触发的偏移量
   */
  topOffset?: number
  /**
   * sticky相对根节点
   */
  root?: HTMLElement
  /**
   * sticky状态切换回调
   */
  onStickyToogle: (
    sticky: boolean,
    args: {
      rawStyle: string
    },
  ) => void
  /**
   * 是否启用sticky
   */
  enable?: boolean
  /**
   * debug
   */
  debug?: boolean
}

/**
 * js实现sticky效果
 */
export default function useSticky(props: Props) {
  const { target, topOffset = 0, root = getAppRoot(), holder, onStickyToogle, enable = true } = props

  const previousSticky = useRef<boolean>()
  const targetStyle = useRef<string>()

  useEffect(() => {
    if (target && isUndefined(targetStyle.current)) {
      targetStyle.current = target.getAttribute('style') || ''
    }
  }, [target])

  const [_inView] = useInViewport(holder, {
    root,
    rootMargin: `-${topOffset * 2}px 0px`,
  })

  const toogleSticky = useMemoizedFn((sticky: boolean) => {
    const args = {
      rawStyle: targetStyle.current || '',
    }
    previousSticky.current = sticky
    onStickyToogle(sticky, args)
  })

  useUpdateEffect(() => {
    if (!enable) {
      toogleSticky(false)
    }
  }, [enable])

  const handleScroll = useMemoizedFn(() => {
    if (target && enable) {
      const inView = isUndefined(_inView) ? true : !!_inView

      const { top } = target.getBoundingClientRect()

      let isSticky: boolean

      if (top <= topOffset && inView) {
        isSticky = true
      } else {
        isSticky = false
      }

      if (previousSticky.current !== isSticky) {
        toogleSticky(isSticky)
      }
    }
  })

  useEventListener('scroll', handleScroll)
}
