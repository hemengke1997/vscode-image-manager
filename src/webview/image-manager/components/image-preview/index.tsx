import { range, round } from '@minko-fe/lodash-pro'
import { useClickAway, useMemoizedFn, useThrottleFn } from '@minko-fe/react-hook'
import { isDev } from '@minko-fe/vite-config/client'
import { ConfigProvider, Image, theme } from 'antd'
import { type AliasToken, type ComponentTokenMap } from 'antd/es/theme/interface'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import GlobalContext from '../../contexts/global-context'
import SettingsContext from '../../contexts/settings-context'
import useImageContextMenu from '../context-menus/components/image-context-menu/hooks/use-image-context-menu'
import LazyImage, { type LazyImageProps } from '../lazy-image'
import Toast from '../toast'

function imageToken(isDarkBackground: boolean): Partial<ComponentTokenMap['Image'] & AliasToken> {
  return {
    previewOperationColor: isDarkBackground ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
    previewOperationColorDisabled: isDarkBackground ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
    previewOperationHoverColor: isDarkBackground ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
    colorTextLightSolid: isDarkBackground ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
  }
}

export type ImagePreviewProps = {
  /**
   * 预览图片列表
   */
  images: ImageType[]
  /**
   * 透传给 LazyImage 组件的 props
   */
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

  const { show, hideAll } = useImageContextMenu()

  useEffect(() => {
    if (!preview.open) {
      Toast.hide()
      hideAll()
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

  const selectedImageRefs = useRef<HTMLDivElement[]>([])
  const [selectedImages, setSelectedImages] = useState<number[]>([])

  useClickAway(() => {
    setSelectedImages([])
  }, [...selectedImageRefs.current, document.querySelector('#context-menu-mask')])

  const onContextMenu = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>, image: ImageType) => {
    const selected = selectedImages.map((i) => images[i])
    show({
      event: e,
      props: {
        images: selected.length ? selected : [image],
        sameLevelImages: images,
        sameWorkspaceImages: getSameWorkspaceImages(image),
        ...lazyImageProps?.contextMenu,
      },
    })
  })

  return (
    <>
      <div className={'flex flex-wrap gap-2'}>
        <ConfigProvider
          theme={{
            components: {
              Image: {
                ...imageToken(isDarkBackground),
              },
            },
          }}
        >
          <Image.PreviewGroup
            preview={{
              destroyOnClose: true,
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
                          images: [images[info.current]],
                          sameLevelImages: images,
                          sameWorkspaceImages: getSameWorkspaceImages(images[info.current]),
                          ...lazyImageProps?.contextMenu,
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
                <div
                  key={image.path + image.stats.ctime}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey) {
                      // 点击多选
                      setSelectedImages((t) => {
                        const index = t.indexOf(i)
                        if (index === -1) {
                          return [...t, i]
                        } else {
                          return t.filter((t) => t !== i)
                        }
                      })
                      return
                    }

                    if (e.shiftKey) {
                      if (!selectedImages.length) {
                        setSelectedImages([i])
                        return
                      }
                      // start-end 多选
                      const start = selectedImages[0]
                      const end = i
                      setSelectedImages([...range(start, end), end])
                      return
                    }

                    setSelectedImages([i])
                  }}
                  ref={(ref) => {
                    selectedImageRefs.current[i] = ref!
                  }}
                >
                  <LazyImage
                    {...lazyImageProps}
                    antdImageProps={{
                      ...(lazyImageProps?.antdImageProps || {}),
                      style: {
                        backgroundColor,
                      },
                      className: 'object-scale-down',
                      width: imageWidth,
                      height: imageWidth,
                      src: image.vscodePath,
                    }}
                    onPreviewClick={() => {
                      setPreview({ open: true, current: i })
                    }}
                    contextMenu={lazyImageProps?.contextMenu}
                    onContextMenu={(e) => onContextMenu(e, image)}
                    image={image}
                    active={selectedImages.includes(i)}
                    onActiveChange={(active) => {
                      setSelectedImages((t) => {
                        if (active) {
                          return [...t, i]
                        } else {
                          return t.filter((t) => t !== i)
                        }
                      })
                    }}
                  />
                </div>
              ))}
            </ConfigProvider>
          </Image.PreviewGroup>
        </ConfigProvider>
      </div>
    </>
  )
}

export default memo(ImagePreview)
