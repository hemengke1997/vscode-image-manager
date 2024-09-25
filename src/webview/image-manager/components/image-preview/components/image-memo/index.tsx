import { memo, useMemo } from 'react'
import { useMemoizedFn } from 'ahooks'
import LazyImage, { type LazyImageProps } from '../../../lazy-image'
import PreviewContext from '../../contexts/preview-context'

/**
 * 为了更好的性能，把 image-preview 组件中无法在memo的函数和变量等提取出来memo化
 */
function LazyImageMemo(
  props: LazyImageProps & {
    index: number
  },
) {
  const { image, index, antdImageProps, ...rest } = props

  const { multipleClick, setSelectedImages, setPreview, onContextMenu } = PreviewContext.useSelector((ctx) => ctx)

  const handleActiveChange = useMemoizedFn((active: boolean) => {
    setSelectedImages((t) => multipleClick(t, image.path, active))
  })

  const handlePreviewClick = useMemoizedFn(() => {
    setPreview({ open: true, current: index })
  })

  const handleContextMenu = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
    onContextMenu(e, image)
  })

  const _antdImageProps = useMemo(
    () => ({
      ...antdImageProps,
      src: image.vscodePath,
    }),
    [image.vscodePath, antdImageProps],
  )

  return (
    <LazyImage
      {...rest}
      image={image}
      antdImageProps={_antdImageProps}
      onActiveChange={handleActiveChange}
      onPreviewClick={handlePreviewClick}
      onContextMenu={handleContextMenu}
    />
  )
}

export default memo(LazyImageMemo)
