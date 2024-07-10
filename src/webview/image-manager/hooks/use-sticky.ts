import { isNull, isUndefined } from '@minko-fe/lodash-pro'
import { useInViewport, useMemoizedFn } from '@minko-fe/react-hook'
import { type DependencyList, useEffect, useLayoutEffect, useRef } from 'react'
import { getAppRoot } from '~/webview/utils'

type Props = {
  target: HTMLElement | null
  holder?: HTMLElement | null
  topOffset?: number
  root?: HTMLElement
  onStickyToogle: (
    sticky: boolean,
    args: {
      style: string
    },
  ) => void
  enable?: boolean
}

export function useSticky(props: Props, deps?: DependencyList) {
  const { target, topOffset = 0, root = getAppRoot(), holder, onStickyToogle, enable = true } = props

  const targetStyle = useRef<string>()

  useEffect(() => {
    if (target && isNull(targetStyle.current)) {
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
        style: targetStyle.current || '',
      }

      if (top <= topOffset && inView) {
        onStickyToogle(true, args)
      } else {
        onStickyToogle(false, args)
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
