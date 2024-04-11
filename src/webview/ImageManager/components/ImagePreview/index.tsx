import { round } from '@minko-fe/lodash-pro'
import { useThrottleFn } from '@minko-fe/react-hook'
import { isDev } from '@minko-fe/vite-config/client'
import { ConfigProvider, Image, theme } from 'antd'
import { motion } from 'framer-motion'
import { memo, useCallback, useEffect, useState } from 'react'
import GlobalContext from '../../contexts/GlobalContext'
import SettingsContext from '../../contexts/SettingsContext'
import useImageContextMenu from '../../hooks/useImageContextMenu'
import { findSameDirImages } from '../../utils'
import LazyImage, { type LazyImageProps } from '../LazyImage'
import Toast from '../Toast'

export type ImagePreviewProps = {
  images: ImageType[]
  lazyImageProps?: Partial<LazyImageProps>
}

function ImagePreview(props: ImagePreviewProps) {
  const { images, lazyImageProps } = props

  const { token } = theme.useToken()

  const { imageWidth, imageState } = GlobalContext.usePicker(['imageWidth', 'imageState'])
  const { isDarkBackground, backgroundColor, tinyBackgroundColor } = SettingsContext.usePicker([
    'isDarkBackground',
    'backgroundColor',
    'tinyBackgroundColor',
  ])

  const [preview, setPreview] = useState<{ open?: boolean; current?: number }>({ open: false, current: -1 })

  const { show } = useImageContextMenu()

  useEffect(() => {
    if (!preview.open) {
      Toast.hide()
    }
  }, [preview.open])

  const throttleOpenToast = useThrottleFn(
    (sclalePercent: number) => {
      if (!sclalePercent || !preview.open) return
      Toast.open({
        content: (
          <div className={'flex items-center'}>
            <span>{sclalePercent}%</span>
          </div>
        ),
      })
    },
    {
      leading: true,
      trailing: true,
      wait: 60,
    },
  )

  const getSameWorkspaceImages = useCallback(
    (image: ImageType) => {
      return imageState.data.find((t) => t.workspaceFolder === image.workspaceFolder)?.images || []
    },
    [imageState.data],
  )

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
              keyboard: true,
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
                        props: {
                          ...lazyImageProps?.contextMenu,
                          image: images[info.current],
                          sameLevelImages: images,
                          sameDirImages: findSameDirImages(images[info.current], images),
                          sameWorkspaceImages: getSameWorkspaceImages(images[info.current]),
                        },
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
                  throttleOpenToast.run(sclalePercent)
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
                    ...(lazyImageProps?.imageProp || {}),
                  }}
                  preview={preview}
                  onPreviewChange={(p) => {
                    setPreview(p)
                  }}
                  contextMenu={{
                    ...lazyImageProps?.contextMenu,
                    sameLevelImages: images,
                    sameDirImages: findSameDirImages(image, images),
                    sameWorkspaceImages: getSameWorkspaceImages(image),
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
    </>
  )
}

export default memo(ImagePreview)
