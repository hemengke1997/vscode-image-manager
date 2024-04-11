import { useControlledState } from '@minko-fe/react-hook'
import { Card, Divider, Empty, Modal } from 'antd'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { type ImageOperatorProps } from '../ImageOperator'
import ImagePreview from '../ImagePreview'

export type ImageSimilarityProps = Omit<ImageOperatorProps, 'images'> & {
  image: ImageType
  similarImages: { image: ImageType; distance: number }[]
}

function ImageSimilarity(props: ImageSimilarityProps) {
  const { open: openProp, onOpenChange, image, similarImages } = props
  const { t } = useTranslation()

  const [open, setOpen] = useControlledState({
    defaultValue: openProp,
    value: openProp,
    onChange: onOpenChange,
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
    >
      <Card>
        <div className={'flex justify-center'}>
          <ImagePreview
            images={[image]}
            lazyImageProps={{
              contextMenu: {
                operable: false,
              },
              tooltipDisplayFullPath: true,
            }}
          ></ImagePreview>
        </div>
      </Card>
      <Divider plain dashed className={'!my-4'} />
      <Card title={t('im.similar_images')}>
        {images.length ? (
          <div className={'max-h-96 overflow-auto'}>
            <ImagePreview
              images={images}
              lazyImageProps={{
                contextMenu: {
                  operable: false,
                },
                tooltipDisplayFullPath: true,
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
