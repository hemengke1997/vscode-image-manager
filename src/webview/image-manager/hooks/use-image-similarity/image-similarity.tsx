import { useControlledState } from 'ahooks-x'
import { Card, Divider, Empty } from 'antd'
import { produce } from 'immer'
import { remove } from 'lodash-es'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import useScrollRef from '~/webview/image-manager/hooks/use-scroll-ref'
import { type ImageOperatorProps } from '../../components/image-operator'
import ImagePreview from '../../components/image-preview'
import useImageManagerEvent from '../use-image-manager-event'
import { type ImperativeModalProps } from '../use-imperative-modal'

export type ImageSimilarityProps = Omit<ImageOperatorProps, 'images'> & {
  /**
   * 被比较的图片
   */
  image: ImageType
  /**
   * 相似图片
   */
  similarImages: { image: ImageType; distance: number }[]
}

function ImageSimilarity(props: ImageSimilarityProps & ImperativeModalProps) {
  const { image, similarImages: similarImagesProp, id, onClose } = props
  const { t } = useTranslation()

  const [similarImages, setSimilarImages] = useControlledState({
    defaultValue: similarImagesProp,
  })

  useImageManagerEvent({
    on: {
      reveal_in_viewer: () => {
        onClose(id)
      },
      rename: (previosImage, newImage) => {
        setSimilarImages(
          produce((draft) => {
            const index = draft.findIndex((t) => t.image.path === previosImage.path)
            if (index !== -1) {
              draft[index].image = newImage
            }
          }),
        )
      },
      delete: (images) => {
        setSimilarImages(
          produce((draft) => {
            const removedIndex: number[] = []
            images.forEach((image) => {
              const index = draft.findIndex((t) => t.image.path === image.path)
              if (index !== -1) {
                removedIndex.push(index)
              }
            })
            remove(draft, (_, index) => removedIndex.includes(index))
          }),
        )
      },
    },
  })

  const { images } = useMemo(() => {
    const images = similarImages
      .sort((t) => t.distance)
      .map(({ image }) => ({
        ...image,
      }))

    return {
      images,
    }
  }, [similarImages])

  const { scrollRef } = useScrollRef()

  return (
    <>
      <Card>
        <div className={'flex justify-center'}>
          <ImagePreview
            images={[image]}
            lazyImageProps={{
              contextMenu: {
                enable: {
                  reveal_in_viewer: true,
                },
              },
              imageNameProps: {
                tooltipDisplayFullPath: true,
              },
              lazy: false,
            }}
          ></ImagePreview>
        </div>
      </Card>
      <Divider plain dashed className={'!my-4'} />
      <Card title={t('im.similar_images')}>
        {images.length ? (
          <div className={'max-h-[500px] overflow-auto'} ref={scrollRef}>
            <ImagePreview
              images={images}
              lazyImageProps={{
                contextMenu: {
                  enable: {
                    reveal_in_viewer: true,
                    fs: true,
                  },
                },
                imageNameProps: {
                  tooltipDisplayFullPath: true,
                },
                lazy: {
                  root: scrollRef.current!,
                },
              }}
            ></ImagePreview>
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('im.no_image')} />
        )}
      </Card>
    </>
  )
}

export default memo(ImageSimilarity)
