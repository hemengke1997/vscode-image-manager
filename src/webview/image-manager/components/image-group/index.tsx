import { type ForwardedRef, forwardRef, memo, type ReactNode, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-atom-toast'
import { FaLock, FaLockOpen } from 'react-icons/fa6'
import { useMemoizedFn } from 'ahooks'
import { useControlledState } from 'ahooks-x'
import { Button, ConfigProvider, Image, theme } from 'antd'
import { type AliasToken, type ComponentTokenMap } from 'antd/es/theme/interface'
import { range, round } from 'es-toolkit'
import { type PreviewGroupPreview } from 'rc-image/es/PreviewGroup'
import { classNames } from 'tw-clsx'
import { isDev } from 'vite-config-preset/client'
import { DEFAULT_WORKSPACE_STATE, WorkspaceStateKey } from '~/core/persist/workspace/common'
import logger from '~/utils/logger'
import useImageManagerEvent, { IMEvent } from '../../hooks/use-image-manager-event'
import { useWorkspaceState } from '../../hooks/use-workspace-state'
import GlobalStore from '../../stores/global-store'
import SettingsStore from '../../stores/settings-store'
import { clearTimestamp } from '../../utils'
import useImageContextMenu, {
  type ImageContextMenuType,
} from '../context-menus/components/image-context-menu/hooks/use-image-context-menu'
import LazyImage, { type LazyImageProps } from '../lazy-image'
import { PreventClickAway, ShouldClickAway } from '../viewer/hooks/use-click-image-away'
import useLazyLoadImages from './use-lazy-load-images'

function imageToken(isDarkBackground: boolean): Partial<ComponentTokenMap['Image'] & AliasToken> {
  return {
    previewOperationColor: isDarkBackground ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
    previewOperationColorDisabled: isDarkBackground ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
    previewOperationHoverColor: isDarkBackground ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
    colorTextLightSolid: isDarkBackground ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
  }
}

export type ImageGroupProps = {
  /**
   * 图片组标识(目录绝对路径)
   */
  id?: string
  /**
   * 图片列表
   */
  images: ImageType[]
  /**
   * 工作区所有可见图片
   */
  workspaceImages?: ImageType[]
  /**
   * 透传给 LazyImage 组件的 props
   */
  lazyImageProps?: Partial<LazyImageProps>
  /**
   * 是否开启多选功能
   */
  enableMultipleSelect?: boolean
  /**
   * 多选时，右键菜单回调
   */
  onMultipleSelectContextMenu?: () => ImageType[]
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
   * 点击空白处时，是否清空选中的图片
   */
  clearSelectedOnBlankClick?: boolean
  /**
   * 右键菜单启用项
   */
  enableContextMenu?: ImageContextMenuType['enableContextMenu']
  /**
   * 清空所有图片组选中的图片
   */
  onClearImageGroupSelected?: () => void
  /**
   * 是否是viewer中的图片组
   */
  inViewer?: boolean
}

const ToastKey = 'image-preview-scale'

// 每次加载200张图片
const PageSize = 200

/**
 * 图片组
 * 展示一组图片列表，并支持预览、多选等功能
 * 页面中可能同时存在多个图片组
 */
function ImageGroup(props: ImageGroupProps, ref: ForwardedRef<HTMLDivElement>) {
  const {
    images: imagesProp,
    workspaceImages,
    lazyImageProps,
    enableContextMenu,
    enableMultipleSelect = false,
    interactive = true,
    renderer = (c) => c,
    onMultipleSelectContextMenu,
    clearSelectedOnBlankClick,
    onClearImageGroupSelected,
    selectedImages: selectedImagesProp,
    onSelectedImagesChange,
    inViewer,
  } = props

  const { token } = theme.useToken()
  const { imageWidth, imageReveal } = GlobalStore.useStore(['imageWidth', 'imageReveal'])

  const [index, setIndex] = useState<number>(-1)

  const [images] = useLazyLoadImages({
    images: imagesProp,
    pageSize: PageSize,
    target: ref as React.MutableRefObject<HTMLElement>,
    index,
  })

  useEffect(() => {
    if (inViewer) {
      if (imageReveal) {
        const cleanPath = clearTimestamp(imageReveal)
        const index = imagesProp.findIndex((t) => t.path === cleanPath)
        setIndex(index)
      } else {
        setIndex(-1)
      }
    }
  }, [imageReveal])

  const preview_scale = GlobalStore.useStore((ctx) => ctx.workspaceState.preview_scale)
  const { isDarkBackground, backgroundColor, tinyBackgroundColor } = SettingsStore.useStore([
    'isDarkBackground',
    'backgroundColor',
    'tinyBackgroundColor',
  ])

  const [previewScale, setPreviewScale] = useWorkspaceState(WorkspaceStateKey.preview_scale, preview_scale)
  const [lockedScale, setLockedScale] = useState(true)

  /* ------------------- 选择的图片 ------------------ */
  const [selectedImages, _setSelectedImages] = useControlledState({
    defaultValue: [],
    value: selectedImagesProp,
    onChange: onSelectedImagesChange,
  })

  const setSelectedImages: typeof _setSelectedImages = useMemoizedFn((...args) => {
    if (!interactive) return
    _setSelectedImages(...args)
  })

  const [preview, setPreview] = useState<{ open?: boolean; current?: number }>({ open: false, current: -1 })

  const { show, hideAll } = useImageContextMenu()

  useEffect(() => {
    if (!preview.open) {
      onToastClose()
      hideAll()
    }
  }, [preview.open])

  const onToastClose = useMemoizedFn(() => {
    if (!lockedScale) {
      setPreviewScale(DEFAULT_WORKSPACE_STATE.preview_scale)
    }

    toast.close(ToastKey)
  })

  const toastContent = useMemoizedFn((sclalePercent: number, lockedScale: boolean) => {
    const Icon = lockedScale ? FaLock : FaLockOpen

    return (
      <div className={'flex items-center gap-2'}>
        <span>{sclalePercent}%</span>
        <Button
          size={'small'}
          // TODO: 为什么这个icon的parentElement是null
          icon={<Icon className={'prevent-click-away !text-white'} />}
          onClick={() => {
            setLockedScale((t) => !t)
            if (!lockedScale) {
              setPreviewScale(sclalePercent / 100)
              logger.debug('锁定缩放比例', sclalePercent / 100)
            }
            toast.update(ToastKey, {
              content: toastContent(sclalePercent, !lockedScale),
            })
          }}
          type='text'
        ></Button>
      </div>
    )
  })

  const openToast = useMemoizedFn((sclalePercent: number) => {
    if (!sclalePercent || !preview.open) return

    setLockedScale(false)

    toast.open({
      content: toastContent(sclalePercent, lockedScale),
      key: ToastKey,
    })
  })

  useImageManagerEvent({
    on: {
      [IMEvent.reveal_in_viewer]: () => {
        if (preview.open) {
          setPreview({
            open: false,
          })
        }
      },
      [IMEvent.clear_selected_images]: () => {
        if (!inViewer) {
          if (selectedImages.length) {
            setSelectedImages([])
          }
        }
      },
      [IMEvent.clear_viewer_selected_images]: () => {
        if (inViewer) {
          if (selectedImages.length) {
            setSelectedImages([])
          }
        }
      },
    },
  })

  const onContextMenu = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>, image: ImageType) => {
    let selected: ImageType[] | undefined = undefined

    if (!selectedImages.some((t) => t.path === image.path)) {
      // 如果之前选中的图片中没有当前图片，则清空选中的图片
      // 并选中当前图片
      onClearImageGroupSelected?.()
      selected = [image]
      setSelectedImages(selected)
    } else {
      selected = onMultipleSelectContextMenu?.() || selectedImages
    }

    show({
      event: e,
      props: {
        image,
        images: selected,
        sameLevelImages: images,
        sameWorkspaceImages: workspaceImages,
        enableContextMenu: {
          ...enableContextMenu,
          preview: true,
        },
        z_commands: {
          preview: {
            onClick: (image) => {
              handlePreviewClick(image)
            },
          },
        },
        shortcutsVisible: true,
      },
    })
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
          // 没有选中图片，说明是第一次shift点击
          // 此时如果有其他目录的图片被选中，需要清空
          onClearImageGroupSelected?.()

          setSelectedImages([image])
          return
        }
        // start-end 多选
        const start = selectedImages[0]
        const end = image
        const indexOfStart = images.findIndex((t) => t.path === start.path)
        const indexOfEnd = images.findIndex((t) => t.path === end.path)

        setSelectedImages(
          [...range(indexOfStart, indexOfEnd, indexOfEnd > indexOfStart ? 1 : -1), indexOfEnd].map((i) => images[i]),
        )
        return
      }
    }

    // 如果没有开启多选，或者没有按下 ctrl/meta/shift 键，则清空选中的图片
    onClearImageGroupSelected?.()
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
    onToastClose()
  })

  const handleVisibleChange = useMemoizedFn((v: boolean, _, current: number) => {
    if (!v) {
      setPreview({ open: v, current })
      return
    }
    if (v) return
  })

  const handleImageRender = useMemoizedFn<Exclude<PreviewGroupPreview['imageRender'], undefined>>(
    (originalNode, info) => {
      return (
        <>
          <div
            className={
              'fixed left-[50%] top-16 z-[1] translate-x-[-50%] rounded bg-[rgba(0,0,0,0.1)] px-3 py-1 text-xl text-ant-color-text-light-solid shadow'
            }
          >
            {images[info.current]?.basename}
          </div>
          <div
            onContextMenu={(e) => {
              show({
                event: e,
                props: {
                  image: images[info.current],
                  sameLevelImages: images,
                  sameWorkspaceImages: workspaceImages,
                  enableContextMenu: {
                    ...enableContextMenu,
                    reveal_in_viewer: true,
                    copy: false,
                    rename: false,
                    delete: false,
                    cut: false,
                    compress: false,
                    crop: false,
                    find_similar_in_all: false,
                    find_similar_in_same_level: false,
                    format_conversion: false,
                    preview: false, // 已经是预览状态了，禁止再次预览
                  },
                  shortcutsVisible: false, // 预览状态下，不显示快捷键
                },
              })
            }}
            className={'contents'}
          >
            {originalNode}
          </div>
        </>
      )
    },
  )

  const handleTransform: PreviewGroupPreview['onTransform'] = useMemoizedFn((info) => {
    if (['wheel', 'zoomIn', 'zoomOut'].includes(info.action)) {
      const scalePercent = round(info.transform.scale * 100)
      openToast(scalePercent)
    }
  })

  const previewProps: PreviewGroupPreview = useMemo(() => {
    return {
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
      scaleStep: 0.05,
      imageRender: handleImageRender,
      onTransform: handleTransform,
      initialTransform: {
        x: 0,
        y: 0,
        rotate: 0,
        scale: previewScale,
        flipX: false,
        flipY: false,
      },
    }
  }, [preview, previewScale, handlePreviewChange, handleVisibleChange, handleImageRender, handleTransform])

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
      <div
        className={classNames('flex flex-wrap gap-1.5', clearSelectedOnBlankClick && ShouldClickAway.Viewer)}
        ref={ref}
      >
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
                  className={classNames(PreventClickAway.Viewer, PreventClickAway.Other)}
                >
                  {renderer(
                    <LazyImage
                      {...lazyImageProps}
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
