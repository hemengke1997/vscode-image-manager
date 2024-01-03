import { isDev } from '@minko-fe/vite-config/client'
import { ConfigProvider, Image, theme } from 'antd'
import { motion } from 'framer-motion'
import { memo, useState } from 'react'
import { type ImageType } from '../..'
import ImageManagerContext from '../../contexts/ImageManagerContext'
import LazyImage from '../LazyImage'

export type ImagePreviewProps = {
  images: ImageType[]
}

function ImagePreview(props: ImagePreviewProps) {
  const { images } = props

  const { token } = theme.useToken()

  const { config, scale, isDarkBackground, tinyBackgroundColor, backgroundColor } = ImageManagerContext.usePicker([
    'config',
    'scale',
    'isDarkBackground',
    'tinyBackgroundColor',
    'backgroundColor',
  ])
  const BASE_SIZE = config.imageDefaultWidth

  const [preview, setPreview] = useState<{ open?: boolean; current?: number }>({})

  return (
    <motion.div className={'mx-auto flex flex-wrap gap-6'}>
      <ConfigProvider
        theme={{
          components: {
            Image: {
              previewOperationColor: isDarkBackground ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
              previewOperationColorDisabled: isDarkBackground ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
              previewOperationHoverColor: isDarkBackground ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
              colorTextLightSolid: isDarkBackground ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
            },
          },
        }}
      >
        <Image.PreviewGroup
          preview={{
            visible: preview?.open,
            current: preview?.current,
            maskClosable: false,
            movable: isDev() ? false : true,
            style: {
              backgroundColor: tinyBackgroundColor.setAlpha(0.9).toRgbString(),
            },
            onChange(current) {
              setPreview({ current, open: true })
            },
            onVisibleChange: (v, _) => {
              if (!v) {
                setPreview({ open: v })
                return
              }
            },
            maxScale: 50,
            minScale: 0.1,
            scaleStep: 0.3,
          }}
          items={images.map((t) => ({
            src: t.vscodePath,
          }))}
        >
          <ConfigProvider
            theme={{
              components: {
                Image: {
                  colorTextLightSolid: token.colorTextLightSolid,
                },
              },
            }}
          >
            {images.map((t, i) => (
              <LazyImage
                image={{
                  style: { backgroundColor },
                  width: BASE_SIZE * scale!,
                  height: BASE_SIZE * scale!,
                  src: t.vscodePath,
                }}
                preview={preview}
                onPreviewChange={(p) => {
                  setPreview(p)
                }}
                info={t}
                index={i}
                key={t.path}
              />
            ))}
          </ConfigProvider>
        </Image.PreviewGroup>
      </ConfigProvider>
    </motion.div>
  )
}

export default memo(ImagePreview)
