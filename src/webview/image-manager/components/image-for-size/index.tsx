import { memo, useEffect, useMemo, useRef } from 'react'
import { useSize } from 'ahooks'
import GlobalContext from '../../contexts/global-context'
import LazyImage from '../lazy-image'

function ImageForSize() {
  const { imageState, setImagePlaceholderSize } = GlobalContext.usePicker(['setImagePlaceholderSize', 'imageState'])
  const imageWidth = GlobalContext.useSelector((ctx) => ctx.extConfig.viewer.imageWidth)
  const imageForSize = useMemo(() => imageState.data[0]?.images[0], [imageState.data])
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
