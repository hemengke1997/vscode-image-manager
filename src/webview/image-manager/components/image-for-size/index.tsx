import { memo, useEffect, useMemo, useRef } from 'react'
import { useSize } from 'ahooks'
import GlobalStore from '../../stores/global-store'
import ImageStore from '../../stores/image-store'
import LazyImage from '../lazy-image'

function ImageForSize() {
  const image = ImageStore.useStore((ctx) => ctx.imageState.workspaces[0]?.images[0])

  const { setImagePlaceholderSize } = GlobalStore.useStore(['setImagePlaceholderSize'])
  const imageWidth = GlobalStore.useStore((ctx) => ctx.extConfig.viewer.imageWidth)
  const imageForSize = useMemo(() => image, [image])
  const imageForSizeRef = useRef<HTMLDivElement>(null)

  const size = useSize(imageForSizeRef)

  useEffect(() => {
    if (!size) return
    setImagePlaceholderSize(size)
  }, [size])

  return imageForSize ? (
    <div ref={imageForSizeRef} className={'fixed left-[-9999px] top-[-9999px]'}>
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
  ) : null
}

export default memo(ImageForSize)
