import { isString, range, round } from '@minko-fe/lodash-pro'
import { useClickAway, useMemoizedFn, useThrottleFn } from '@minko-fe/react-hook'
import { isDev } from '@minko-fe/vite-config/client'
import { ConfigProvider, Image, theme } from 'antd'
import { type AliasToken, type ComponentTokenMap } from 'antd/es/theme/interface'
import { produce } from 'immer'
import { memo, useCallback, useEffect, useId, useRef, useState } from 'react'
import GlobalContext from '../../contexts/global-context'
import SettingsContext from '../../contexts/settings-context'
import useImageOperation from '../../hooks/use-image-operation'
import useImageContextMenu from '../context-menus/components/image-context-menu/hooks/use-image-context-menu'
import useImageContextMenuEvent from '../context-menus/components/image-context-menu/hooks/use-image-context-menu-event'
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
  /**
   * 是否开启多选功能
   */
  enableMultipleSelect?: boolean
}

function ImagePreview(props: ImagePreviewProps) {
  const { images, lazyImageProps, enableMultipleSelect = false } = props

  const { token } = theme.useToken()

  const { imageWidth, imageState } = GlobalContext.usePicker(['imageWidth', 'imageState'])
  const { isDarkBackground, backgroundColor, tinyBackgroundColor } = SettingsContext.usePicker([
    'isDarkBackground',
    'backgroundColor',
    'tinyBackgroundColor',
  ])

  const { beginDeleteImageProcess } = useImageOperation()

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

  const selectedImageRefs = useRef<Record<string, HTMLDivElement>>({})
  /* ------------------- 选择的图片 ------------------ */
  // 使用图片的绝对路径path作为唯一标识
  // index并不能保证选择的图片是正确的
  const [selectedImages, setSelectedImages] = useState<ImageType['path'][]>([])
  const [triggeredByContextMenu, setTriggeredByContextMenu] = useState(false)

  const preventClickAway = useMemoizedFn((el: HTMLElement, classNames: string[]) => {
    let parent = el.parentElement
    while (parent) {
      if (parent.tagName === 'body') {
        return false
      }
      if (
        isString(parent.className) &&
        classNames.filter(Boolean).some((className) => parent?.className.includes(className))
      ) {
        return true
      }
      parent = parent.parentElement!
    }
    return false
  })

  useClickAway(
    (e) => {
      const targetEl = e.target as HTMLElement
      if (
        preventClickAway(targetEl, [
          'ant-image-preview',
          'ant-message',
          'ant-tooltip',
          'ant-popover',
          enableMultipleSelect ? 'ant-modal' : '',
        ])
      )
        return
      if (targetEl.id === 'context-menu-mask') {
        if (triggeredByContextMenu) {
          setTriggeredByContextMenu(false)
          setSelectedImages([])
          return
        }
        return
      }
      setSelectedImages([])
    },
    Object.keys(selectedImageRefs.current)
      .map((t) => selectedImageRefs.current[t])
      .filter((t) => !!t),
    ['click', 'contextmenu'],
  )

  const id = useId()

  const { imageContextMenuEvent } = useImageContextMenuEvent({
    on: {
      context_menu(_, _id) {
        // 清除非当前层级的选中
        if (id !== _id) {
          setSelectedImages([])
        }
      },
    },
  })

  const onContextMenu = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>, image: ImageType) => {
    imageContextMenuEvent.emit('context_menu', image, id)
    let selected = selectedImages
    if (selectedImages.length <= 1 || !selectedImages.includes(image.path)) {
      selected = [image.path]
      setTriggeredByContextMenu(true)
    }
    setSelectedImages(selected)
    show({
      event: e,
      props: {
        image,
        images: selected.map((t) => images.find((i) => i.path === t)!),
        sameLevelImages: images,
        sameWorkspaceImages: getSameWorkspaceImages(image),
        ...lazyImageProps?.contextMenu,
      },
    })
  })

  const onClick = useMemoizedFn((e: React.MouseEvent<HTMLDivElement, MouseEvent>, image: ImageType) => {
    if (enableMultipleSelect) {
      if (e.metaKey || e.ctrlKey) {
        // 点击多选
        setSelectedImages((t) => {
          const index = t.indexOf(image.path)
          return multipleClick(t, image.path, index === -1)
        })
        return
      }

      if (e.shiftKey) {
        if (!selectedImages.length) {
          setSelectedImages([image.path])
          return
        }
        // start-end 多选
        const start = selectedImages[0]
        const end = image.path
        const indexOfStart = images.findIndex((t) => t.path === start)
        const indexOfEnd = images.findIndex((t) => t.path === end)
        setSelectedImages([...range(indexOfStart, indexOfEnd), indexOfEnd].map((i) => images[i].path))
        return
      }
    }

    if (selectedImages.length === 1 && selectedImages[0] === image.path) {
      return
    }
    setSelectedImages([image.path])
  })

  const multipleClick = useMemoizedFn((previous: string[], path: string, shouldAdd: boolean) => {
    if (shouldAdd) {
      return [...previous, path]
    } else {
      return previous.filter((t) => t !== path)
    }
  })

  useEffect(() => {
    if (selectedImages.length && selectedImages.some((t) => !images.find((i) => i.path === t))) {
      setSelectedImages(
        produce((draft) => {
          return draft.filter((t) => images.find((i) => i.path === t))
        }),
      )
    }
  }, [images])

  const multipleSelect = useMemoizedFn((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    return enableMultipleSelect ? e.metaKey || e.ctrlKey || e.shiftKey : false
  })

  const onDelete = useMemoizedFn(() => {
    beginDeleteImageProcess(selectedImages.map((t) => images.find((i) => i.path === t)!))
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
                Toast.hide()
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
                          image: images[info.current],
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
                  key={image.vscodePath}
                  onClick={(e) => onClick(e, image)}
                  ref={(ref) => (selectedImageRefs.current[image.path] = ref!)}
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
                    onPreviewClick={() => setPreview({ open: true, current: i })}
                    contextMenu={lazyImageProps?.contextMenu}
                    onContextMenu={(e) => onContextMenu(e, image)}
                    image={image}
                    active={selectedImages.includes(image.path)}
                    onActiveChange={(active) =>
                      setSelectedImages((t) => {
                        return multipleClick(t, image.path, active)
                      })
                    }
                    multipleSelect={multipleSelect}
                    onDelete={onDelete}
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
