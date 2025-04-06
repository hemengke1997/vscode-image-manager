import { useMemo, useRef, useState } from 'react'
import { useEventListener, useMemoizedFn, useThrottleFn, useUpdateEffect } from 'ahooks'
import { ceil } from 'es-toolkit/compat'
import { DEFAULT_CONFIG } from '~/core/config/common'
import { getAppRoot } from '~/webview/utils'
import GlobalStore from '../../stores/global-store'

interface UseElementBottomStatusProps {
  targetRef: React.MutableRefObject<HTMLElement>
  offset: number // 距离底部的偏移量
}

function useElementBottom({ targetRef, offset }: UseElementBottomStatusProps) {
  const [isBottomInView, setIsBottomInView] = useState(false)

  const { run } = useThrottleFn(
    () => {
      const target = targetRef.current
      if (!target) return

      const containerRect = getAppRoot().getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()

      const isBottom = targetRect.bottom - offset <= containerRect.bottom

      setIsBottomInView(isBottom)
    },
    {
      wait: 60,
    },
  )

  useEventListener('scroll', run, {
    target: getAppRoot(),
  })

  return isBottomInView
}

type Props = {
  images: ImageType[]
  pageSize: number
  target: React.MutableRefObject<HTMLElement>
}
export default function useLazyLoadImages(props: Props) {
  const { images, pageSize, target } = props

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
    loading: boolean
    hasMore: boolean
  }>({
    loading: false,
    hasMore: hasMore(loadedImages.images),
  })

  const isBottomInView = useElementBottom({ targetRef: target, offset: rootVerticalMargin(10) })

  const addImages = useMemoizedFn((pageNum: number) => {
    if (status.current.loading || !status.current.hasMore) return

    status.current.loading = true

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

    status.current.loading = false
  })

  useUpdateEffect(() => {
    status.current.hasMore = true
    if (loadedImages.images.length) {
      addImages(loadedImages.page)
    } else {
      addImages(loadedImages.page + 1)
    }
  }, [images])

  useUpdateEffect(() => {
    if (isBottomInView) {
      addImages(loadedImages.page + 1)
    }
  }, [isBottomInView])

  return [useMemo(() => loadedImages.images, [loadedImages.images])]
}

export function useLazyMargin() {
  const { imagePlaceholderSize } = GlobalStore.useStore(['imagePlaceholderSize'])

  const rootVerticalMargin = useMemoizedFn(
    (rate: number) => (imagePlaceholderSize?.height || DEFAULT_CONFIG.viewer.imageWidth) * rate,
  )

  return {
    rootVerticalMargin,
  }
}
