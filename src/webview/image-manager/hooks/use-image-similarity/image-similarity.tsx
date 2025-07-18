import type { Props as ImageOperatorProps } from '../../components/image-operator'
import type { ImperativeModalProps } from '~/webview/image-manager/hooks/use-imperative-antd-modal'
import { Card, Divider } from 'antd'
import { remove } from 'es-toolkit'
import { produce } from 'immer'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useControlledState } from '~/webview/image-manager/hooks/use-controlled-state'
import useScrollRef from '~/webview/image-manager/hooks/use-scroll-ref'
import EmptyImage from '../../components/empty'
import ImageGroup from '../../components/image-group'
import useImageManagerEvent, { IMEvent } from '../use-image-manager-event'

type Props = Omit<ImageOperatorProps, 'images'> & {
  /**
   * 被比较的图片
   */
  image: ImageType
  /**
   * 相似图片
   */
  similarImages: { image: ImageType, distance: number }[]
}

function ImageSimilarity(props: Props & ImperativeModalProps) {
  const { image, similarImages: similarImagesProp } = props
  const { t } = useTranslation()

  const [similarImages, setSimilarImages] = useControlledState({
    defaultValue: similarImagesProp,
  })

  useImageManagerEvent({
    on: {
      [IMEvent.rename]: (previosImage, newImage) => {
        // 图片重命名后，更新相似图片中的图片信息
        setSimilarImages(
          produce((draft) => {
            const index = draft.findIndex(t => t.image.path === previosImage.path)
            if (index !== -1) {
              draft[index].image = newImage
            }
          }),
        )
      },
      [IMEvent.delete]: (images) => {
        setSimilarImages(
          produce((draft) => {
            const removedIndex: number[] = []
            images.forEach((image) => {
              const index = draft.findIndex(t => t.image.path === image.path)
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
      .sort(t => t.distance)
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
        <div className='flex justify-center'>
          <ImageGroup
            images={[image]}
            lazyImageProps={{
              imageNameProps: {
                tooltipDisplayFullPath: true,
              },
              lazy: false,
            }}
          >
          </ImageGroup>
        </div>
      </Card>
      <Divider plain dashed className='!my-4' />
      <Card title={t('im.similar_images')}>
        {images.length
          ? (
              <div className='max-h-[500px] overflow-auto' ref={scrollRef}>
                <ImageGroup
                  images={images}
                  lazyImageProps={{
                    imageNameProps: {
                      tooltipDisplayFullPath: true,
                    },
                    lazy: {
                      root: scrollRef.current!,
                    },
                  }}
                >
                </ImageGroup>
              </div>
            )
          : (
              <EmptyImage />
            )}
      </Card>
    </>
  )
}

export default memo(ImageSimilarity)
