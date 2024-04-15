import { useControlledState } from '@minko-fe/react-hook'
import { Card, Divider, Empty, Modal } from 'antd'
import { produce } from 'immer'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import useImageContextMenuEvent from '../ContextMenus/components/ImageContextMenu/hooks/useImageContextMenuEvent'
import { type ImageOperatorProps } from '../ImageOperator'
import ImagePreview from '../ImagePreview'

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

  useImageContextMenuEvent({
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
      delete: (image) => {
        setSimilarImages(
          produce((draft) => {
            const index = draft.findIndex((t) => t.image.path === image.path)
            if (index !== -1) {
              draft.splice(index, 1)
            }
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
            }}
          ></ImagePreview>
        </div>
      </Card>
      <Divider plain dashed className={'!my-4'} />
      <Card title={t('im.similar_images')}>
        {images.length ? (
          <div className={'max-h-[500px] overflow-auto'}>
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
