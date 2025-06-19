import type { AliasToken, ComponentTokenMap } from 'antd/es/theme/interface'
import type { PreviewGroupPreview } from 'rc-image/es/PreviewGroup'
import { useDeepCompareEffect, useMemoizedFn } from 'ahooks'
import { Button, ConfigProvider, type GetProps, Image, theme } from 'antd'
import { range, round } from 'es-toolkit'
import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { type ForwardedRef, forwardRef, memo, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { FaLock, FaLockOpen } from 'react-icons/fa6'
import { isDev } from 'vite-config-preset/isomorph'
import { DEFAULT_WORKSPACE_STATE, WorkspaceStateKey } from '~/core/persist/workspace/common'
import logger from '~/utils/logger'
import { useControlledState } from '~/webview/image-manager/hooks/use-controlled-state'
import { classNames } from '~/webview/image-manager/utils/tw-clsx'
import { getAppRoot } from '~/webview/utils'
import useImageManagerEvent, { IMEvent } from '../../hooks/use-image-manager-event'
import { useWorkspaceState } from '../../hooks/use-workspace-state'
import { GlobalAtoms } from '../../stores/global/global-store'
import { useImageWidth } from '../../stores/global/hooks'
import { useImageBackgroundColor, useIsDarkBackground, useTinyBackgroundColor } from '../../stores/settings/hooks'
import { VscodeAtoms } from '../../stores/vscode/vscode-store'
import { clearTimestamp } from '../../utils'
import useImageContextMenu, {
  type ImageContextMenuType,
} from '../context-menus/components/image-context-menu/hooks/use-image-context-menu'
import LazyImage from '../lazy-image'
import { PreventClickAway, ShouldClickAway } from '../viewer/hooks/use-click-image-away'
import useLazyLoadImages from './use-lazy-load-images'

function imageToken(isDarkBackground: boolean): Partial<ComponentTokenMap['Image'] & AliasToken> {
  return {
    previewOperationColor: isDarkBackground ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
    previewOperationColorDisabled: isDarkBackground ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
    previewOperationHoverColor: isDarkBackground ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
    colorTextLightSolid: isDarkBackground ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
  }
}

interface Props {
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
  lazyImageProps?: Partial<GetProps<typeof LazyImage>>
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
function ImageGroup(props: Props, ref: ForwardedRef<HTMLDivElement>) {
  const {
    images: imagesProp,
    workspaceImages,
    lazyImageProps,
    enableContextMenu,
    enableMultipleSelect = false,
    interactive = true,
    onMultipleSelectContextMenu,
    clearSelectedOnBlankClick,
    onClearImageGroupSelected,
    selectedImages: selectedImagesProp,
    onSelectedImagesChange,
    inViewer,
  } = props

  const renderer = useMemoizedFn(props.renderer || (c => c))

  const { token } = theme.useToken()
  const containerRef = useRef<HTMLDivElement>(null)

  const [imageWidth] = useImageWidth()
  const imageReveal = useAtomValue(GlobalAtoms.imageRevealAtom)

  const [index, setIndex] = useState<number>(-1)

  const [images] = useLazyLoadImages({
    images: imagesProp,
    pageSize: PageSize,
    target: containerRef?.current,
    container: lazyImageProps?.lazy ? lazyImageProps.lazy.root : getAppRoot(),
    index,
  })

  useDeepCompareEffect(() => {
    if (inViewer) {
      if (imageReveal) {
        const cleanPath = clearTimestamp(imageReveal)
        const index = imagesProp.findIndex(t => t.path === cleanPath)
        logger.debug('Reveal Image Index', index)
        setIndex(index)
      }
    }
  }, [
    imageReveal,
    // 可能在imageReveal变化后，但 imagesProp 还未更新，导致index找不到
    // 所以需要依赖 imagesProp
    imagesProp,
  ])

  const preview_scale = useAtomValue(
    selectAtom(
      VscodeAtoms.workspaceStateAtom,
      useMemoizedFn(state => state[WorkspaceStateKey.preview_scale]),
    ),
  )

  const [isDarkBackground] = useIsDarkBackground()
  const [backgroundColor] = useImageBackgroundColor()
  const [tinyBackgroundColor] = useTinyBackgroundColor()

  const [previewScale, setPreviewScale] = useWorkspaceState(WorkspaceStateKey.preview_scale, preview_scale)
  const [lockedScale, setLockedScale] = useState(true)

  /* ------------------- 选择的图片 ------------------ */
  const [selectedImages, _setSelectedImages] = useControlledState({
    defaultValue: [],
    value: selectedImagesProp,
    onChange: onSelectedImagesChange,
  })

  const setSelectedImages = useMemoizedFn((...args: Parameters<typeof _setSelectedImages>) => {
    if (!interactive)
      return
    _setSelectedImages(...args)
  })

  const [preview, setPreview] = useState<{ open?: boolean, current?: number }>({ open: false, current: -1 })

  const { show, hideAll } = useImageContextMenu()

  const onToastClose = useMemoizedFn(() => {
    if (!lockedScale) {
      setPreviewScale(DEFAULT_WORKSPACE_STATE.preview_scale)
    }

    toast.remove(ToastKey)
  })
  useEffect(() => {
    if (!preview.open) {
      onToastClose()
      hideAll()
    }
  }, [preview.open])

  const toastContent = useMemoizedFn((sclalePercent: number, lockedScale: boolean) => {
    const Icon = lockedScale ? FaLock : FaLockOpen

    return (
      <div className='flex items-center gap-2'>
        <span>
          {sclalePercent}
          %
        </span>
        <Button
          size='small'
          // TODO: 为什么这个icon的parentElement是null
          icon={<Icon className='prevent-click-away !text-white' />}
          onClick={() => {
            setLockedScale(t => !t)
            if (!lockedScale) {
              setPreviewScale(sclalePercent / 100)
              logger.debug('锁定缩放比例', sclalePercent / 100)
            }
            toast(toastContent(sclalePercent, !lockedScale), {
              id: ToastKey,
            })
          }}
          type='text'
        >
        </Button>
      </div>
    )
  })

  const openToast = useMemoizedFn((sclalePercent: number) => {
    if (!sclalePercent || !preview.open)
      return

    setLockedScale(false)

    toast(toastContent(sclalePercent, lockedScale), {
      id: ToastKey,
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

  /**
   * 如果已选中，则取消选中，如果未选中，则选中
   */
  const toggleImageSelection = useMemoizedFn((previous: ImageType[], image: ImageType, selected: boolean) => {
    previous = previous.filter(t => t.path !== image.path)

    if (selected) {
      return [...previous, image]
    }
    else {
      return [...previous]
    }
  })

  const handlePreviewClick = useMemoizedFn((image: ImageType) => {
    const index = images.findIndex(t => t.path === image.path)
    setPreview({ open: true, current: index })
  })

  const onContextMenu = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>, image: ImageType) => {
    let selected: ImageType[] | undefined

    if (!selectedImages.some(t => t.path === image.path)) {
      // 如果之前选中的图片中没有当前图片，则清空选中的图片
      // 并选中当前图片
      onClearImageGroupSelected?.()
      selected = [image]
      setSelectedImages(selected)
    }
    else {
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
          const index = t.findIndex(i => i.path === image.path)
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
        const indexOfStart = images.findIndex(t => t.path === start.path)
        const indexOfEnd = images.findIndex(t => t.path === end.path)

        setSelectedImages(
          [...range(indexOfStart, indexOfEnd, indexOfEnd > indexOfStart ? 1 : -1), indexOfEnd].map(i => images[i]),
        )
        return
      }
    }

    // 如果没有开启多选，或者没有按下 ctrl/meta/shift 键，则清空选中的图片
    onClearImageGroupSelected?.()
    setSelectedImages([image])
  })

  useEffect(() => {
    if (selectedImages.length) {
      // 筛选images中存在的selectedImage
      setSelectedImages(t => t.filter(t => images.some(i => i.path === t.path)))
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
    }
  })

  const handleImageRender = useMemoizedFn<Exclude<PreviewGroupPreview['imageRender'], undefined>>(
    (originalNode, info) => {
      return (
        <>
          <div
            className='fixed left-1/2 top-16 z-[1] -translate-x-1/2 rounded bg-[rgba(0,0,0,0.1)] px-3 py-1 text-xl text-ant-color-text-light-solid shadow'
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
            className='contents'
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
    } satisfies PreviewGroupPreview
  }, [preview, previewScale, handlePreviewChange, handleVisibleChange, handleImageRender, handleTransform])

  const previewItems = useMemo(
    () =>
      images.map(t => ({
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

  return (
    <div ref={containerRef}>
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
              {images.map(image => (
                <div
                  key={image.key}
                  onClick={e => onClick(e, image)}
                  className={classNames(PreventClickAway.Viewer, PreventClickAway.Other)}
                >
                  {renderer(
                    <LazyImage
                      {...lazyImageProps}
                      image={image}
                      selected={selectedImages.some(t => t.path === image.path)}
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
    </div>
  )
}

export default memo(forwardRef(ImageGroup))
