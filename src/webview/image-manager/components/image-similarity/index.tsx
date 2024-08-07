import { remove } from '@minko-fe/lodash-pro'
import { useControlledState } from '@minko-fe/react-hook'
import { Card, Divider, Empty, Modal } from 'antd'
import { produce } from 'immer'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useScrollRef } from '~/webview/image-manager/hooks/use-scroll-ref'
import useImageManagerEvent from '../../hooks/use-image-manager-event'
import { type ImageOperatorProps } from '../image-operator'
import ImagePreview from '../image-preview'

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

function ImageSimilarity(props: ImageSimilarityProps) {
  const { open: openProp, onOpenChange, image, similarImages: similarImagesProp, ...rest } = props
  const { t } = useTranslation()

  const [similarImages, setSimilarImages] = useControlledState({
    defaultValue: similarImagesProp,
  })

  const [open, setOpen] = useControlledState({
    defaultValue: openProp,
    value: openProp,
    onChange: onOpenChange,
  })

  useImageManagerEvent({
    on: {
      reveal_in_viewer: () => {
        setOpen(false)
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
    <Modal
      title={t('im.find_similar_images')}
      width={'80%'}
      open={open}
      footer={null}
      onCancel={() => setOpen(false)}
      maskClosable={false}
      destroyOnClose
      {...rest}
    >
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
    </Modal>
  )
}

export default memo(ImageSimilarity)
