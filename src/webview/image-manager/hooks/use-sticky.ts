import { useInViewport, useMemoizedFn } from 'ahooks'
import { isUndefined } from 'lodash-es'
import { type DependencyList, useEffect, useLayoutEffect, useRef } from 'react'
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
}

export default function useSticky(props: Props, deps?: DependencyList) {
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

  const handleScroll = useMemoizedFn(() => {
    if (target && enable) {
      const inView = isUndefined(_inView) ? true : !!_inView

      const { top } = target.getBoundingClientRect()

      const args = {
        rawStyle: targetStyle.current || '',
      }

      let isSticky: boolean

      if (top <= topOffset && inView) {
        isSticky = true
      } else {
        isSticky = false
      }
      if (previousSticky.current !== isSticky) {
        onStickyToogle(isSticky, args)
        previousSticky.current = isSticky
      }
    }
  })

  useLayoutEffect(() => {
    root.addEventListener('scroll', handleScroll)
    return () => {
      root.removeEventListener('scroll', handleScroll)
    }
  }, [...(deps || [])])
}
