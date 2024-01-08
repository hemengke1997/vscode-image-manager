import { useSize } from '@minko-fe/react-hook'
import { memo, useEffect, useMemo, useRef } from 'react'
import ImageManagerContext from '../../contexts/ImageManagerContext'
import LazyImage from '../LazyImage'

function ImageForSize() {
  const { config, scale, imageState, setImagePlaceholderSize } = ImageManagerContext.usePicker([
    'config',
    'scale',
    'setImagePlaceholderSize',
    'imageState',
  ])
  const BASE_SIZE = config.imageDefaultWidth
  const imageForSize = useMemo(() => imageState.data[0]?.imgs[0], [imageState.data])
  const imageForSizeRef = useRef<HTMLDivElement>(null)

  const size = useSize(imageForSizeRef)

  useEffect(() => {
    if (!size) return
    setImagePlaceholderSize(size)
  }, [size])

  return imageForSize ? (
    <div ref={imageForSizeRef} className={'fixed left-[-9999px] top-[-9999px]'}>
      <LazyImage
        imageProp={{
          width: BASE_SIZE * scale!,
          height: BASE_SIZE * scale!,
          src: imageForSize.vscodePath,
        }}
        image={imageForSize}
        lazy={false}
      />
    </div>
  ) : null
}

export default memo(ImageForSize)
