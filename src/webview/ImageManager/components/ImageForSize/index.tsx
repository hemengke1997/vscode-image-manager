import { useSize } from '@minko-fe/react-hook'
import { memo, useEffect, useMemo, useRef } from 'react'
import GlobalContext from '../../contexts/GlobalContext'
import LazyImage from '../LazyImage'

function ImageForSize() {
  const { imageState, setImagePlaceholderSize } = GlobalContext.usePicker([
    'extConfig',
    'setImagePlaceholderSize',
    'imageState',
  ])
  const imageWidth = GlobalContext.useSelector((ctx) => ctx.extConfig.viewer.imageWidth)
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
          width: imageWidth,
          height: imageWidth,
          src: imageForSize.vscodePath,
        }}
        image={imageForSize}
        lazy={false}
      />
    </div>
  ) : null
}

export default memo(ImageForSize)
