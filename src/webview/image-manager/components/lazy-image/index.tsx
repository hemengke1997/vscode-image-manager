import { memo, type ReactNode, useEffect, useMemo, useRef } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { animateScroll } from 'react-scroll'
import { useInViewport, useMemoizedFn, useSetState } from 'ahooks'
import { useControlledState } from 'ahooks-x'
import { Image, type ImageProps } from 'antd'
import { trim } from 'lodash-es'
import { motion } from 'motion/react'
import { FiCheckCircle } from 'react-icons/fi'
import { HiOutlineViewfinderCircle } from 'react-icons/hi2'
import { MdOutlineRemoveCircle } from 'react-icons/md'
import { RiErrorWarningLine } from 'react-icons/ri'
import { RxDimensions } from 'react-icons/rx'
import { TbResize } from 'react-icons/tb'
import { Key } from 'ts-key-enum'
import { classNames } from 'tw-clsx'
import { DEFAULT_CONFIG } from '~/core/config/common'
import { Compressed } from '~/enums'
import { CmdToVscode } from '~/message/cmd'
import { OS } from '~/webview/image-manager/utils/device'
import { getAppRoot } from '~/webview/utils'
import { vscodeApi } from '~/webview/vscode-api'
import GlobalContext from '../../contexts/global-context'
import SettingsContext from '../../contexts/settings-context'
import useImageDetails from '../../hooks/use-image-details/use-image-details'
import useImageOperation from '../../hooks/use-image-operation'
import { bytesToUnit, clearTimestamp, formatBytes } from '../../utils'
import { ANIMATION_DURATION } from '../../utils/duration'
import useImageContextMenu, {
  type ImageContextMenuType,
} from '../context-menus/components/image-context-menu/hooks/use-image-context-menu'
import ImageName, { type ImageNameProps } from '../image-name'
import Corner from './components/corner'

export type LazyImageProps = {
  /**
   * 图片信息
   */
  image: ImageType
  /**
   * 点击预览回调
   * 如果不传此参数，则不会显示预览功能
   */
  onPreviewClick?: (image: ImageType) => void
  /**
   * 是否懒加载
   * @default
   * {
   *    root: getAppRoot()
   * }
   */
  lazy?:
    | false
    | {
        /**
         * 懒加载根节点
         * 必传
         */
        root: HTMLElement
      }
  /**
   * 点击remove icon回调
   * 如果不传此参数，则不会显示remove icon
   */
  onRemoveClick?: (image: ImageType) => void
  /**
   * 增强渲染remove icon
   */
  removeRender?: (children: ReactNode, image: ImageType) => ReactNode
  /**
   * 右键上下文回调
   */
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>, image: ImageType) => void
  /**
   * 删除回调
   */
  onDelete?: (image: ImageType) => void
  /**
   * 图片右键上下文
   */
  contextMenu: Omit<ImageContextMenuType, 'image' | 'images'> | undefined
  /**
   * 透传给 antd Image 组件的 props
   */
  antdImageProps: ImageProps
  /**
   * 透传给 ImageName 组件的props
   */
  imageNameProps?: ImageNameProps
  /**
   * 图片状态
   */
  active?: boolean
  /**
   * 图片状态改变回调
   */
  onActiveChange?: (image: ImageType, active: boolean) => void
  /**
   * 多选状态
   */
  multipleSelect?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => boolean
  /**
   * 是否可交互
   */
  interactive?: boolean
}

function LazyImage(props: LazyImageProps) {
  const {
    image,
    onPreviewClick,
    lazy = {
      root: getAppRoot(),
    },
    onRemoveClick,
    onDelete,
    removeRender = (n) => n,
    contextMenu,
    antdImageProps,
    imageNameProps,
    active,
    onActiveChange,
    onContextMenu,
    multipleSelect = () => false,
    interactive = true,
  } = props

  const root = lazy ? lazy.root : null

  const { beginRenameImageProcess, beginDeleteImageProcess, handleCopyString } = useImageOperation()
  const { t } = useTranslation()
  const [showImageDetails] = useImageDetails()

  const [selected, setSelected] = useControlledState<boolean>({
    value: active,
    onChange(value) {
      onActiveChange?.(image, value)
    },
  })

  const { hoverShowImageDetail } = SettingsContext.usePicker(['hoverShowImageDetail'])
  const { imagePlaceholderSize, imageReveal } = GlobalContext.usePicker(['imagePlaceholderSize', 'imageReveal'])

  const imageWidth = GlobalContext.useSelector((ctx) => ctx.extConfig.viewer.imageWidth)
  const warningSize = GlobalContext.useSelector((ctx) => ctx.extConfig.viewer.warningSize)
  const imageRendering = GlobalContext.useSelector((ctx) => ctx.extConfig.viewer.imageRendering)

  const imageStyle = useMemo(
    () => ({
      imageRendering,
      ...antdImageProps.style,
    }),
    [imageRendering, antdImageProps.style],
  )

  const rootMargin = useMemo(
    () => `${(imagePlaceholderSize?.height || DEFAULT_CONFIG.viewer.imageWidth) * 4.5}px 0px`,
    [imagePlaceholderSize?.height],
  ) // expand area of vertical intersection calculation

  const elRef = useRef<HTMLDivElement>(null)

  const imageMetadata = useMemo(() => {
    return {
      compressed: image.info.compressed,
      metadata: image.info.metadata,
    }
  }, [image.info.compressed, image.info.metadata])

  const [elInView] = useInViewport(elRef, {
    root,
    rootMargin,
  })

  const handleDelete = useMemoizedFn(() => {
    if (onDelete) {
      onDelete(image)
      return
    }
    hideAll()
    beginDeleteImageProcess([image])
  })

  const setKeybindRef = useHotkeys<HTMLDivElement>(
    [Key.F2, Key.Enter, `mod+${Key.Backspace}`, Key.Delete, `mod+c`],
    (e) => {
      if (e.target !== keybindRef.current) return
      if (contextMenu?.enable?.fs) {
        switch (e.key) {
          case Key.Enter: {
            if (!OS.isWindows) {
              hideAll()
              beginRenameImageProcess(image)
            }
            return
          }
          // windows rename key
          case Key.F2: {
            if (OS.isWindows) {
              hideAll()
              beginRenameImageProcess(image)
            }
            return
          }
          case Key.Backspace: {
            if (!OS.isWindows) {
              handleDelete()
            }
            return
          }
          // windows delete key
          case Key.Delete: {
            if (OS.isWindows) {
              handleDelete()
            }
            return
          }
          case 'c': {
            hideAll()
            handleCopyString(image, { proto: 'name' })
            return
          }
          default:
            break
        }
      }
    },
    {
      enabled(e) {
        if (!elInView) {
          return false
        }
        return !!(e.target as HTMLDivElement).dataset.image_context_menu
      },
    },
  )

  const keybindRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (keybindRef.current) {
      setKeybindRef(keybindRef.current)
    }
  }, [keybindRef.current])

  const sizeWarning = useMemo((): boolean => {
    if (!!warningSize && bytesToUnit(image.stats.size, 'KB') > warningSize) {
      return true
    }
    return false
  }, [image.stats.size, warningSize])

  const { hideAll } = useImageContextMenu()

  const isTargetImage = useMemoizedFn(() => {
    return (
      !contextMenu?.enable?.reveal_in_viewer && trim(image.path).length && image.path === clearTimestamp(imageReveal)
    )
  })

  /**
   * 判断元素是否完整在视窗内
   */
  const isElInViewport = useMemoizedFn((el) => {
    const rect = el.getBoundingClientRect()
    const windowHeight = window.innerHeight || document.documentElement.clientHeight
    const windowWidth = window.innerWidth || document.documentElement.clientWidth
    const isInViewport = rect.top >= 0 && rect.left >= 0 && rect.bottom <= windowHeight && rect.right <= windowWidth
    return isInViewport
  })

  // 如果当前图片是用户右键打开的图片
  // 则滚动到图片位置
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    let idleTimer: ReturnType<typeof requestIdleCallback>
    let scrolled = false

    if (isTargetImage()) {
      setSelected(true)

      // 清空 imageReveal，避免下次打开webview时使用之前的 imageReveal 导致滚动
      vscodeApi.postMessage({ cmd: CmdToVscode.reveal_image_in_viewer, data: { filePath: '' } })

      // 刚打开时，图片可能还未加载，所以需要等待图片加载完成后再滚动
      const callback = () => {
        try {
          if (scrolled || isElInViewport(elRef.current)) {
            return
          }
          const y = elRef.current?.getBoundingClientRect().top
          const clientHeight = document.documentElement.clientHeight

          if (y && !scrolled) {
            animateScroll.scrollTo(
              y + getAppRoot().scrollTop - clientHeight / 2 + (imagePlaceholderSize?.height || 0) / 2,
              {
                duration: 0,
                smooth: true,
                delay: 0,
                containerId: 'root',
              },
            )
            scrolled = true
          }
        } finally {
          setTriggerFocus((t) => ({ current: t.current + 1 }))
        }
      }

      // 从explorer打开图片时，需要使用 requestIdleCallback
      idleTimer = requestIdleCallback(() => {
        callback()
      })
      timer = setTimeout(() => {
        callback()
      })
    } else if (imageReveal) {
      setSelected(false)
    }

    return () => {
      if (isTargetImage()) {
        setSelected(false)
        clearTimeout(timer)
        cancelIdleCallback(idleTimer)
      }
    }
  }, [imageReveal, image.path])

  const [triggerFocus, setTriggerFocus] = useSetState({ prev: 0, current: 0 })
  useEffect(() => {
    if (keybindRef.current) {
      if (triggerFocus.prev !== triggerFocus.current) {
        keybindRef.current.focus()
        setTriggerFocus({ prev: triggerFocus.current })
      }
    }
  }, [keybindRef.current, triggerFocus])

  /**
   * @param depth 父元素查找深度，默认向上查找3层，如果查不到 [data-disable_dbclick] 元素，则可以双击
   */
  const preventDbClick = useMemoizedFn((el: HTMLElement, depth: number = 3) => {
    let parent = el
    let count = 0
    while (parent) {
      if (count > depth) {
        return false
      }
      if (parent.dataset.disable_dbclick) {
        // prevent double-click
        return true
      }
      parent = parent.parentElement!
      count++
    }

    return false
  })

  const computedMaskFontSize = useMemo(() => {
    const base = 0.875 // 基础字体大小 text-sm 0.875rem
    const factor = 0.001 // 比例因子
    return base + (imageWidth - DEFAULT_CONFIG.viewer.imageWidth) * factor
  }, [imageWidth])

  const previewMask = useMemoizedFn(() => {
    return (
      <div
        className={'flex size-full flex-col items-center justify-center'}
        style={{
          fontSize: `${computedMaskFontSize}rem`,
        }}
      >
        {onPreviewClick && (
          <div
            className={classNames(
              'flex cursor-pointer items-center space-x-1 truncate transition-colors hover:text-ant-color-text active:text-ant-color-text-label',
            )}
            onClick={(e) => {
              if (multipleSelect(e)) return
              // prevent click away
              e.stopPropagation()
              e.preventDefault()
              onPreviewClick(image)
            }}
            data-disable_dbclick
          >
            <HiOutlineViewfinderCircle />
            <span>{t('im.preview')}</span>
          </div>
        )}
        <div className={'flex items-center space-x-1 truncate'}>
          <TbResize />
          <span className={classNames(sizeWarning && 'text-ant-color-warning-text')}>
            {formatBytes(image.stats.size)}
          </span>
        </div>
        {imageMetadata?.metadata.width && imageMetadata?.metadata.height ? (
          <div className={'flex items-center space-x-1 truncate'}>
            <RxDimensions />
            <span className={'flex items-center'}>
              {imageMetadata?.metadata.width}x{imageMetadata?.metadata.height}
            </span>
          </div>
        ) : null}
        {imageMetadata?.compressed === Compressed.yes ? (
          <div className={'flex items-center space-x-1 truncate'}>
            <FiCheckCircle />
            <span>{t('im.compressed')}</span>
          </div>
        ) : null}
      </div>
    )
  })

  const imagePreivew = useMemo(() => {
    if (hoverShowImageDetail && lazy) {
      return {
        mask: previewMask(),
        maskClassName: 'rounded-md !cursor-default !transition-none',
        className: 'min-w-24',
        src: antdImageProps.src,
      }
    }

    return false
  }, [lazy, previewMask, antdImageProps.src, hoverShowImageDetail])

  const compressedMap = useMemo(
    () => ({
      [Compressed.yes]: <FiCheckCircle className={'text-sm text-ant-color-text'} title={t('im.compressed')} />,
    }),
    [t],
  )

  // 目前 motion/react viewport root 有bug，在 root 改变后不会重新observe
  // 所以这里需要判断 root 是否存在
  if (lazy && !lazy.root) {
    return null
  }

  return (
    <div ref={elRef} className={'select-none'}>
      {elInView || !lazy ? (
        <motion.div
          ref={keybindRef}
          data-image_context_menu={true}
          tabIndex={-1}
          className={classNames(
            'group relative flex flex-none flex-col items-center space-y-1 p-2',
            'overflow-hidden rounded-lg border-[2px] border-solid border-transparent',
            interactive && 'hover:border-ant-color-border',
            interactive && selected && 'border-ant-color-primary-hover hover:border-ant-color-primary-hover',
          )}
          viewport={{
            once: true,
            amount: 'some',
            margin: rootMargin,
            root: { current: root },
          }}
          transition={{ duration: ANIMATION_DURATION.middle }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          onContextMenu={(e) => onContextMenu?.(e, image)}
          onDoubleClick={(e) => {
            if (multipleSelect(e)) return
            const el = e.target as HTMLElement
            if (preventDbClick(el)) return
            showImageDetails({
              image,
              onPreview: onPreviewClick,
            })
          }}
        >
          <Corner
            leftTop={
              onRemoveClick && (
                <div
                  className={'cursor-pointer text-ant-color-error opacity-0 transition-opacity group-hover:opacity-100'}
                  onClick={(e) => {
                    // prevent click away
                    e.stopPropagation()
                    onRemoveClick(image)
                  }}
                  title={t('im.remove')}
                >
                  {removeRender(<MdOutlineRemoveCircle />, image)}
                </div>
              )
            }
            rightTop={
              sizeWarning && (
                <RiErrorWarningLine className={'text-base'} title={t('im.size_over_warning', { size: warningSize })} />
              )
            }
            rightBottom={compressedMap[imageMetadata.compressed]}
          >
            <Image
              {...antdImageProps}
              className={classNames('rounded-md object-contain p-1 will-change-auto', antdImageProps.className)}
              preview={imagePreivew}
              rootClassName={classNames('transition-all', antdImageProps.rootClassName)}
              style={imageStyle}
              src={image.vscodePath}
            ></Image>
          </Corner>

          <div className='max-w-full truncate' style={{ maxWidth: antdImageProps.width }}>
            {image.nameElement || (
              <ImageName image={image} {...imageNameProps}>
                {image.name}
              </ImageName>
            )}
          </div>
        </motion.div>
      ) : (
        <div
          style={{
            width: imagePlaceholderSize?.width,
            height: imagePlaceholderSize?.height,
          }}
        ></div>
      )}
    </div>
  )
}

export default memo(LazyImage)
