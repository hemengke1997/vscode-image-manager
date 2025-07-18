import { useEventListener, useLatest, useMemoizedFn, useSize, useThrottleFn, useUpdateEffect } from 'ahooks'
import { ceil } from 'es-toolkit/compat'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getAppRoot } from '~/webview/utils'
import { nextTick } from '../../utils'
import { LazyMarginScreenFactor } from '../../utils/meta'

type UseElementBottomStatusProps = {
  target: HTMLElement | null
  container: HTMLElement
  offset: number // 距离底部的偏移量
}

function useElementBottom({ target, offset, container = getAppRoot() }: UseElementBottomStatusProps) {
  const [isBottomInView, setIsBottomInView] = useState(false)

  const latestIsBottomInView = useLatest(isBottomInView)

  const containerRect = useMemo(() => container.getBoundingClientRect(), [container])

  const timer = useRef<NodeJS.Timeout | null>(null)

  const { run } = useThrottleFn(
    () => {
      if (!target)
        return

      timer.current && clearTimeout(timer.current)

      const targetRect = target.getBoundingClientRect()

      // offset 大意味着提前触发底部检测
      const isBottom = targetRect.bottom - offset <= containerRect.bottom

      setIsBottomInView(isBottom)

      timer.current = setTimeout(() => {
        if (latestIsBottomInView.current) {
          setIsBottomInView(false)
          nextTick(() => {
            setIsBottomInView(true)
          })
        }
      }, 100)
    },
    {
      wait: 16,
    },
  )

  useEventListener('scroll', run, {
    target: container,
  })

  return [isBottomInView, setIsBottomInView] as const
}

type Props = {
  images: ImageType[]
  pageSize: number
  /**
   * 如果index!==-1，则加载index位置的图片
   */
  index: number
} & Pick<UseElementBottomStatusProps, 'target' | 'container'>
export default function useLazyLoadImages(props: Props) {
  const { images, pageSize, index, target, container = getAppRoot() } = props

  const { rootVerticalMargin } = useLazyMargin()

  const [loadedImages, setLoadedImages] = useState<{
    images: ImageType[]
    page: number
  }>({
    images: images.slice(0, pageSize),
    page: 1,
  })

  const hasMore = useMemoizedFn((loaded: ImageType[]) => {
    return loaded.length < images.length
  })

  const status = useRef<{
    hasMore: boolean
  }>({
    hasMore: hasMore(loadedImages.images),
  })

  const [isBottomInView, setIsBottomInView] = useElementBottom({ target, container, offset: rootVerticalMargin() })

  const addImages = useMemoizedFn((pageNum: number) => {
    if (!status.current.hasMore)
      return

    setLoadedImages(() => {
      const nextImages = images.slice(0, pageSize * pageNum)

      if (!hasMore(nextImages)) {
        status.current.hasMore = false
        pageNum = ceil(images.length / pageSize)
      }

      return {
        images: nextImages,
        page: pageNum,
      }
    })

    setIsBottomInView(false)
  })

  /**
   * 追加下一页图片
   */
  const append = useMemoizedFn(() => {
    addImages(loadedImages.page + 1)
  })

  useEffect(() => {
    if (index !== -1) {
      const target = images[index]
      if (target) {
        const pageNum = ceil(index + 1 / pageSize)
        addImages(pageNum)
      }
    }
  }, [index])

  useUpdateEffect(() => {
    status.current.hasMore = true
    if (loadedImages.images.length) {
      addImages(loadedImages.page)
    }
    else {
      append()
    }
  }, [images])

  useUpdateEffect(() => {
    if (isBottomInView) {
      append()
    }
  }, [isBottomInView])

  return [useMemo(() => loadedImages.images, [loadedImages.images]), status.current, useMemo(() => ({ append }), [])] as const
}

export function useLazyMargin() {
  const screenHeight = useMemo(() => {
    return getAppRoot().getBoundingClientRect().height
  }, [])

  const { height } = useSize(getAppRoot()) || {}

  const rootVerticalMargin = useMemoizedFn(
    (rate: number = LazyMarginScreenFactor) => {
      const r = height || screenHeight
      return r * rate
    },
  )

  return {
    rootVerticalMargin,
  }
}
