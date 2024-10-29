import { type ForwardedRef, forwardRef, memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { toast } from 'react-atom-toast'
import { useClickAway, useMemoizedFn } from 'ahooks'
import { ConfigProvider, Image, theme } from 'antd'
import { type AliasToken, type ComponentTokenMap } from 'antd/es/theme/interface'
import { produce } from 'immer'
import { isString, range, round } from 'lodash-es'
import { type PreviewGroupPreview } from 'rc-image/es/PreviewGroup'
import { isDev } from 'vite-config-preset/client'
import GlobalContext from '../../contexts/global-context'
import SettingsContext from '../../contexts/settings-context'
import useImageManagerEvent from '../../hooks/use-image-manager-event'
import useImageOperation from '../../hooks/use-image-operation'
import useImageContextMenu from '../context-menus/components/image-context-menu/hooks/use-image-context-menu'
import LazyImage, { type LazyImageProps } from '../lazy-image'

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

const ToastKey = 'image-preview-scale'

toast.setDefaultOptions({
  className:
    'flex items-center justify-center rounded-md bg-black bg-opacity-60 px-2 py-1 text-sm shadow-sm pointer-events-none',
  pauseOnHover: false,
  duration: 1500,
})

function ImagePreview(props: ImagePreviewProps, ref: ForwardedRef<HTMLDivElement>) {
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
      toast.close(ToastKey)
      hideAll()
    }
  }, [preview.open])

  const openToast = useMemoizedFn((sclalePercent: number) => {
    if (!sclalePercent || !preview.open) return

    toast.open({
      content: (
        <div className={'flex items-center'}>
          <span>{sclalePercent}%</span>
        </div>
      ),
      key: ToastKey,
    })
  })

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
        // collapse 中的 image-preview 传了ref，其他的没有传
        // 所以正好用这个ref来判断是否是在collapse中了
        ref &&
        preventClickAway(targetEl, [
          'ant-image-preview',
          'ant-message',
          'ant-tooltip',
          'ant-popover',
          'ant-notification',
          'ant-modal',
        ])
      ) {
        return
      }

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

  const { imageManagerEvent } = useImageManagerEvent({
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
    imageManagerEvent.emit('context_menu', image, id)
    let selected = selectedImages
    if (selectedImages.length <= 1 || !selectedImages.includes(image.path)) {
      selected = [image.path]
      setTriggeredByContextMenu(true)
    }
    setSelectedImages(selected)
    show(
      {
        event: e,
        props: {
          image,
          images: selected.map((t) => images.find((i) => i.path === t)!),
          sameLevelImages: images,
          sameWorkspaceImages: getSameWorkspaceImages(image),
          z_commands: {
            preview: {
              onClick: (image) => {
                handlePreviewClick(image)
              },
            },
          },
          ...lazyImageProps?.contextMenu,
        },
      },
      { shortcutsVisible: true },
    )
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

  const handlePreviewChange = useMemoizedFn((current: number) => {
    setPreview({ current, open: true })
    toast.close(ToastKey)
  })

  const handleVisibleChange = useMemoizedFn((v: boolean, _, current: number) => {
    if (!v) {
      setPreview({ open: v, current })
      return
    }
    if (v) return
  })

  const handleImageRender: PreviewGroupPreview['imageRender'] = useMemoizedFn((originalNode, info) => {
    return (
      <div
        onContextMenu={(e) => {
          show(
            {
              event: e,
              props: {
                image: images[info.current],
                sameLevelImages: images,
                sameWorkspaceImages: getSameWorkspaceImages(images[info.current]),
                ...lazyImageProps?.contextMenu,
              },
            },
            { shortcutsVisible: false },
          )
        }}
        className={'contents'}
      >
        {originalNode}
      </div>
    )
  })

  const handleTransform: PreviewGroupPreview['onTransform'] = useMemoizedFn((info) => {
    if (['wheel', 'zoomIn', 'zoomOut'].includes(info.action)) {
      const scalePercent = round(info.transform.scale * 100)
      openToast(scalePercent)
    }
  })

  const previewProps = useMemo(
    () => ({
      destroyOnClose: true,
      visible: preview?.open,
      current: preview?.current,
      maskClosable: false,
      movable: !isDev(),
      style: {
        backgroundColor: tinyBackgroundColor.setAlpha(0.9).toRgbString(),
      },
      keyboard: true,
      onChange: handlePreviewChange,
      onVisibleChange: handleVisibleChange,
      maxScale: 50,
      minScale: 0.1,
      scaleStep: 0.3,
      imageRender: handleImageRender,
      onTransform: handleTransform,
    }),
    [preview, handlePreviewChange, handleVisibleChange, handleImageRender, handleTransform],
  )

  const previewItems = useMemo(
    () =>
      images.map((t) => ({
        src: t.vscodePath,
      })),
    [images],
  )

  const antdImageProps = useMemo(
    () => ({
      ...(lazyImageProps?.antdImageProps || {}),
      style: {
        backgroundColor,
      },
      className: 'object-scale-down',
      width: imageWidth,
      height: imageWidth,
    }),
    [lazyImageProps?.antdImageProps, backgroundColor, imageWidth],
  )

  const handleActiveChange = useMemoizedFn((image: ImageType, active: boolean) => {
    setSelectedImages((t) => multipleClick(t, image.path, active))
  })

  const handlePreviewClick = useMemoizedFn((image: ImageType) => {
    const index = images.findIndex((t) => t.path === image.path)
    setPreview({ open: true, current: index })
  })

  return (
    <>
      <div className={'flex flex-wrap gap-1.5'} ref={ref}>
        <ConfigProvider
          theme={{
            components: {
              Image: {
                ...imageToken(isDarkBackground),
              },
            },
          }}
        >
          <Image.PreviewGroup preview={previewProps} items={previewItems}>
            <ConfigProvider
              theme={{
                components: {
                  Image: {
                    colorTextLightSolid: token.colorTextLightSolid,
                  },
                },
              }}
            >
              {images.map((image) => (
                <div
                  // vscodePath 是带了修改时间戳的，可以避免图片文件名未改变但内容改变，导致图片不刷新的问题
                  key={image.vscodePath}
                  onClick={(e) => onClick(e, image)}
                  ref={(ref) => (selectedImageRefs.current[image.path] = ref!)}
                >
                  <LazyImage
                    {...lazyImageProps}
                    contextMenu={lazyImageProps?.contextMenu}
                    image={image}
                    active={selectedImages.includes(image.path)}
                    multipleSelect={multipleSelect}
                    onDelete={onDelete}
                    antdImageProps={antdImageProps}
                    onActiveChange={handleActiveChange}
                    onPreviewClick={handlePreviewClick}
                    onContextMenu={onContextMenu}
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

export default memo(forwardRef(ImagePreview))
