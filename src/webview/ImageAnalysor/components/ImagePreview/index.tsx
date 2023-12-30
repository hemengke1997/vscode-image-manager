import { ConfigProvider, Image, theme } from 'antd'
import { motion } from 'framer-motion'
import { memo, useState } from 'react'
import { type ImageType } from '../..'
import ImageAnalysorContext from '../../contexts/ImageAnalysorContext'
import LazyImage from '../LazyImage'

export type ImagePreviewProps = {
  group: {
    label: string
    children: ImageType[]
  }
}

function ImagePreview(props: ImagePreviewProps) {
  const { group } = props

  const { token } = theme.useToken()

  const { config, scale, isDarkBackground, tinyBackgroundColor, backgroundColor } = ImageAnalysorContext.usePicker([
    'config',
    'scale',
    'isDarkBackground',
    'tinyBackgroundColor',
    'backgroundColor',
  ])
  const BASE_SIZE = config.imageDefaultWidth

  const [preview, setPreview] = useState<{ open?: boolean; current?: number }>()

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
            movable: false,
            style: {
              backgroundColor: tinyBackgroundColor.setAlpha(0.9).toRgbString(),
            },
            onChange(current) {
              setPreview({ open: true, current })
            },
            onVisibleChange: (v, _, current) => {
              if (!v) {
                setPreview({ open: v })
                return
              }
              if (current === preview?.current) {
                setPreview({ open: v, current })
                return
              }
              if (v) return
            },
            maxScale: 10,
            minScale: 0.1,
            scaleStep: 0.3,
          }}
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
            {group?.children.map((t, i) => (
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