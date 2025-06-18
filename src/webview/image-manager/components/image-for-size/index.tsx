import { useMemoizedFn, useSize } from 'ahooks'
import { useAtomValue, useSetAtom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { memo, useEffect, useMemo, useRef } from 'react'
import { GlobalAtoms } from '../../stores/global/global-store'
import { imageStateAtom } from '../../stores/image/image-store'
import { VscodeAtoms } from '../../stores/vscode/vscode-store'
import LazyImage from '../lazy-image'

function ImageForSize() {
  const image = useAtomValue(
    selectAtom(
      imageStateAtom,
      useMemoizedFn(state => state.workspaces[0]?.images[0]),
    ),
  )

  const setImagePlaceholderSize = useSetAtom(GlobalAtoms.imagePlaceholderSizeAtom)
  const imageWidth = useAtomValue(
    selectAtom(
      VscodeAtoms.extConfigAtom,
      useMemoizedFn(state => state.viewer.imageWidth),
    ),
  )

  const imageForSize = useMemo(() => image, [image])
  const imageForSizeRef = useRef<HTMLDivElement>(null)

  const size = useSize(imageForSizeRef)

  useEffect(() => {
    if (!size)
      return
    setImagePlaceholderSize(size)
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
