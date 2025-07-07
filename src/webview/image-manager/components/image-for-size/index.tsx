import { useMemoizedFn, useSize } from 'ahooks'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { memo, useEffect, useMemo, useRef } from 'react'
import { getAppRoot } from '~/webview/utils'
import { GlobalAtoms } from '../../stores/global/global-store'
import { useImageWidth } from '../../stores/global/hooks'
import { imageStateAtom } from '../../stores/image/image-store'
import LazyImage from '../lazy-image'

export const imageForSizeRootMargin = 3

function ImageForSize() {
  const image = useAtomValue(
    selectAtom(
      imageStateAtom,
      useMemoizedFn(state => state.workspaces[0]?.images[0]),
    ),
  )

  const setImagePlaceholderSize = useSetAtom(GlobalAtoms.imagePlaceholderSizeAtom)
  const [viewerPageSize, setViewerPageSize] = useAtom(GlobalAtoms.viewerPageSizeAtom)
  const [imageWidth] = useImageWidth()

  const imageForSize = useMemo(() => image, [image])
  const imageForSizeRef = useRef<HTMLDivElement>(null)

  const size = useSize(imageForSizeRef)

  useEffect(() => {
    if (!size)
      return
    setImagePlaceholderSize(size)

    if (viewerPageSize)
      return
    // 根据当前页面宽度/高度计算最多能展示多少个图片，就设置pageSize为多少
    const screen = getAppRoot().getBoundingClientRect()
    const screenWidth = screen.width
    const screenHeight = screen.height

    // 计算一屏最多大概能展示多少个图片
    // 结果比实际展示的数量更大些，因为没有算上padding、margin之类的
    const pageSize = Math.floor(screenWidth / size.width) * Math.floor(screenHeight / size.height)

    // 系数越大，图片数分块越大
    // 意味着假设一屏可以展示 100 张图片，如果 rate 为5，那么每次一页图片 500 张
    const rate = imageForSizeRootMargin
    setViewerPageSize(Math.floor(pageSize * rate))
  }, [size])

  return imageForSize
    ? (
        <div ref={imageForSizeRef} className='fixed left-[-9999px] top-[-9999px]'>
          <LazyImage
            antdImageProps={{
              width: imageWidth,
              height: imageWidth,
              src: imageForSize.vscodePath,
            }}
            image={{
              ...imageForSize,
              path: '',
            }}
            lazy={false}
          />
        </div>
      )
    : null
}

export default memo(ImageForSize)
