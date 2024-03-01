import { round } from '@minko-fe/lodash-pro'
import { useSetState } from '@minko-fe/react-hook'
import { isDev } from '@minko-fe/vite-config/client'
import { ConfigProvider, Image, theme } from 'antd'
import { motion } from 'framer-motion'
import { type ReactNode, memo, startTransition, useEffect, useState } from 'react'
import { useContextMenu } from 'react-contexify'
import { type ImageType } from '../..'
import GlobalContext from '../../contexts/GlobalContext'
import SettingsContext from '../../contexts/SettingsContext'
import { IMAGE_CONTEXT_MENU_ID } from '../ContextMenus/components/ImageContextMenu'
import LazyImage, { type LazyImageProps } from '../LazyImage'
import Toast from '../Toast'

export type ImagePreviewProps = {
  images: ImageType[]
  lazyImageProps?: Partial<LazyImageProps>
}

function ImagePreview(props: ImagePreviewProps) {
  const { images, lazyImageProps } = props

  const { token } = theme.useToken()

  const { imageWidth } = GlobalContext.usePicker(['imageWidth'])
  const { isDarkBackground, backgroundColor, tinyBackgroundColor } = SettingsContext.usePicker([
    'isDarkBackground',
    'backgroundColor',
    'tinyBackgroundColor',
  ])

  const [preview, setPreview] = useState<{ open?: boolean; current?: number }>({ open: false, current: -1 })

  const [scaleToast, setScaleToast] = useSetState<{ open: boolean; content: ReactNode }>({ open: false, content: null })

  const { show } = useContextMenu<{ image: ImageType; dimensions: { width: number; height: number } }>()

  useEffect(() => {
    if (!preview.open) {
      setScaleToast({ open: false })
    }
  }, [preview.open])

  return (
    <>
      <motion.div className={'flex flex-wrap gap-2'}>
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
              movable: !isDev(),
              style: {
                backgroundColor: tinyBackgroundColor.setAlpha(0.9).toRgbString(),
              },
              onChange(current) {
                setPreview({ current, open: true })
              },
              onVisibleChange: (v, _, current) => {
                if (!v) {
                  setPreview({ open: v, current })
                  return
                }
                if (v) return
              },
              maxScale: 50,
              minScale: 0.1,
              scaleStep: 0.3,
              imageRender(originalNode, info) {
                return (
                  <div
                    onContextMenu={(e) => {
                      show({
                        event: e,
                        id: IMAGE_CONTEXT_MENU_ID,
                        props: { image: images[info.current], ...lazyImageProps?.contextMenu },
                      })
                    }}
                    className={'contents'}
                  >
                    {originalNode}
                  </div>
                )
              },
              onTransform(info) {
                if (['wheel', 'zoomIn', 'zoomOut'].includes(info.action)) {
                  const sclalePercent = round(info.transform.scale * 100)
                  startTransition(() => {
                    setScaleToast({
                      open: true,
                      content: (
                        <div className={'flex items-center'}>
                          <span>{sclalePercent}%</span>
                        </div>
                      ),
                    })
                  })
                }
              },
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
              {images.map((image, i) => (
                <LazyImage
                  {...lazyImageProps}
                  imageProp={{
                    style: { backgroundColor },
                    width: imageWidth,
                    height: imageWidth,
                    src: image.vscodePath,
                    ...lazyImageProps?.imageProp,
                  }}
                  preview={preview}
                  onPreviewChange={(p) => {
                    setPreview(p)
                  }}
                  image={image}
                  index={i}
                  key={image.path + image.stats.ctime}
                />
              ))}
            </ConfigProvider>
          </Image.PreviewGroup>
        </ConfigProvider>
      </motion.div>
      <Toast {...scaleToast} onOpenChange={(open) => setScaleToast({ open })} />
    </>
  )
}

export default memo(ImagePreview)
