import {
  type ForwardedRef,
  forwardRef,
  memo,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from 'react-atom-toast'
import { useClickAway, useMemoizedFn } from 'ahooks'
import { useControlledState } from 'ahooks-x'
import { ConfigProvider, Image, theme } from 'antd'
import { type AliasToken, type ComponentTokenMap } from 'antd/es/theme/interface'
import { isString, range, round } from 'lodash-es'
import { type PreviewGroupPreview } from 'rc-image/es/PreviewGroup'
import { classNames } from 'tw-clsx'
import { isDev } from 'vite-config-preset/client'
import GlobalContext from '../../contexts/global-context'
import SettingsContext from '../../contexts/settings-context'
import useImageManagerEvent, { IMEvent } from '../../hooks/use-image-manager-event'
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

export type imageGroupProps = {
  /**
   * 图片组标识(目录绝对路径)
   */
  id?: string
  /**
   * 图片列表
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
  /**
   * 是否可交互
   */
  interactive?: boolean
  /**
   * LazyImage renderer，用于自定义渲染
   */
  renderer?: (lazyImage: ReactNode, image: ImageType) => ReactNode
  /**
   * 受控的 seletedImages
   */
  selectedImages?: ImageType[]
  /**
   * 受控 selectedImages 改变时的回调
   */
  onSelectedImagesChange?: (selectedImages: ImageType[]) => void
  /**
   * 所有选中的图片（包括但不限于当前图片组选中的图片）
   */
  allSelectedImages?: ImageType[]
}

const ToastKey = 'image-preview-scale'

/**
 * 图片组
 * 展示一组图片列表，并支持预览、多选等功能
 */
function ImageGroup(props: imageGroupProps, ref: ForwardedRef<HTMLDivElement>) {
  const {
    id,
    images,
    lazyImageProps,
    enableMultipleSelect = false,
    interactive = true,
    renderer = (c) => c,
    allSelectedImages,
  } = props

  const { token } = theme.useToken()

  const { imageWidth, imageState } = GlobalContext.usePicker(['imageWidth', 'imageState'])
  const { isDarkBackground, backgroundColor, tinyBackgroundColor } = SettingsContext.usePicker([
    'isDarkBackground',
    'backgroundColor',
    'tinyBackgroundColor',
  ])

  /* ------------------- 选择的图片 ------------------ */
  const [selectedImages, _setSelectedImages] = useControlledState({
    defaultValue: [],
    value: props.selectedImages,
    onChange: props.onSelectedImagesChange,
  })

  const setSelectedImages: typeof _setSelectedImages = useMemoizedFn((...args) => {
    if (!interactive) return
    _setSelectedImages(...args)
  })

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

      // 一些优先级比较高的清空
      // 点击的时候清空选中的图片
      if (
        // data-clear-selected 是我希望点击就清空的元素属性
        targetEl.getAttribute('data-clear-selected') ||
        // ant-collapse-content-box 是因为有padding，如果点到了padding部分也需要清空选中图片
        targetEl.classList.contains('ant-collapse-content-box')
      ) {
        return setSelectedImages([])
      }

      // 如果不希望在点击的时候清空选中的图片，直接return即可

      if (
        // collapse 中的 image-group 传了ref，其他的没有传
        // 所以正好用这个ref来判断是否是在collapse中了
        ref &&
        preventClickAway(targetEl, [
          'ant-image-preview',
          'ant-message',
          'ant-tooltip',
          'ant-popover',
          'ant-notification',
          'ant-modal',
          'ant-collapse-item',
        ])
      ) {
        return
      }

      if (targetEl.getAttribute('data-id') === 'context-menu-mask') {
        return
      }

      // 如果没有击中阻止，则清空选中的图片
      setSelectedImages([])
    },
    Object.keys(selectedImageRefs.current)
      .map((t) => selectedImageRefs.current[t])
      .filter((t) => !!t),
    ['click', 'contextmenu'],
  )

  const { imageManagerEvent } = useImageManagerEvent({
    on: {
      [IMEvent.clear_selected_images]: (_id) => {
        if (id !== _id) {
          setSelectedImages([])
        }
      },
    },
  })

  const onContextMenu = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>, image: ImageType) => {
    let selected = selectedImages
    if (selectedImages.length <= 1) {
      selected = [image]
    }

    // 清空非当前组的图片选中
    if (id) {
      imageManagerEvent.emit(IMEvent.clear_selected_images, id)
    }

    setSelectedImages(selected)
    show(
      {
        event: e,
        props: {
          image,
          images: allSelectedImages || selected,
          sameLevelImages: images,
          sameWorkspaceImages: getSameWorkspaceImages(image),

          ...lazyImageProps?.contextMenu,
          enableContextMenu: {
            ...lazyImageProps?.contextMenu?.enableContextMenu,
            preview: true,
          },
          z_commands: {
            preview: {
              onClick: (image) => {
                handlePreviewClick(image)
              },
            },
          },
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
          const index = t.findIndex((i) => i.path === image.path)
          return toggleImageSelection(t, image, index === -1)
        })
        return
      }

      if (e.shiftKey) {
        if (!selectedImages.length) {
          setSelectedImages([image])
          return
        }
        // start-end 多选
        const start = selectedImages[0]
        const end = image
        const indexOfStart = images.findIndex((t) => t.path === start.path)
        const indexOfEnd = images.findIndex((t) => t.path === end.path)
        setSelectedImages([...range(indexOfStart, indexOfEnd), indexOfEnd].map((i) => images[i]))
        return
      }
    }

    // 清空非当前组的图片选中
    if (id) {
      imageManagerEvent.emit(IMEvent.clear_selected_images, id)
    }
    setSelectedImages([image])
  })

  /**
   * 如果已选中，则取消选中，如果未选中，则选中
   */
  const toggleImageSelection = useMemoizedFn((previous: ImageType[], image: ImageType, selected: boolean) => {
    previous = previous.filter((t) => t.path !== image.path)

    if (selected) {
      return [...previous, image]
    } else {
      return [...previous]
    }
  })

  useEffect(() => {
    if (selectedImages.length) {
      // 筛选images中存在的selectedImage
      setSelectedImages((t) => t.filter((t) => images.some((i) => i.path === t.path)))
    }
  }, [images])

  /**
   * 是否正在多选
   */
  const isMultipleSelecting = useMemoizedFn((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    return enableMultipleSelect ? e.metaKey || e.ctrlKey || e.shiftKey : false
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
                enableContextMenu: {
                  ...lazyImageProps?.contextMenu?.enableContextMenu,
                  copy: false,
                  rename: false,
                  delete: false,
                  cut: false,
                  preview: false,
                },
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

  const handleSelectedChange = useMemoizedFn((image: ImageType, selected: boolean) => {
    setSelectedImages((t) => {
      return toggleImageSelection(t, image, selected)
    })
  })

  const handlePreviewClick = useMemoizedFn((image: ImageType) => {
    const index = images.findIndex((t) => t.path === image.path)
    setPreview({ open: true, current: index })
  })

  return (
    <>
      <div className={classNames('flex flex-wrap gap-1.5')} ref={ref} data-clear-selected={true}>
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
                  key={image.key}
                  onClick={(e) => onClick(e, image)}
                  ref={(ref) => (selectedImageRefs.current[image.path] = ref!)}
                >
                  {renderer(
                    <LazyImage
                      {...lazyImageProps}
                      contextMenu={lazyImageProps?.contextMenu}
                      image={image}
                      selected={selectedImages.some((t) => t.path === image.path)}
                      isMultipleSelecting={isMultipleSelecting}
                      antdImageProps={antdImageProps}
                      onSelectedChange={handleSelectedChange}
                      onPreviewClick={handlePreviewClick}
                      onContextMenu={onContextMenu}
                      interactive={interactive}
                    />,
                    image,
                  )}
                </div>
              ))}
            </ConfigProvider>
          </Image.PreviewGroup>
        </ConfigProvider>
      </div>
    </>
  )
}

export default memo(forwardRef(ImageGroup))
