import { motion } from 'motion/react'
import { memo, type ReactNode, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FiCheckCircle } from 'react-icons/fi'
import { HiOutlineViewfinderCircle } from 'react-icons/hi2'
import { MdOutlineRemoveCircle } from 'react-icons/md'
import { RiErrorWarningLine } from 'react-icons/ri'
import { RxDimensions } from 'react-icons/rx'
import { TbResize } from 'react-icons/tb'
import { animateScroll } from 'react-scroll'
import { useInViewport, useMemoizedFn } from 'ahooks'
import { useControlledState } from 'ahooks-x'
import { Image, type ImageProps } from 'antd'
import { trim } from 'lodash-es'
import { classNames } from 'tw-clsx'
import { DEFAULT_CONFIG } from '~/core/config/common'
import { Compressed } from '~/enums'
import { getAppRoot } from '~/webview/utils'
import useImageDetails from '../../hooks/use-image-details/use-image-details'
import GlobalStore from '../../stores/global-store'
import SettingsStore from '../../stores/settings-store'
import { bytesToUnit, clearTimestamp, formatBytes } from '../../utils'
import { ANIMATION_DURATION } from '../../utils/duration'
import ImageName, { type ImageNameProps } from '../image-name'
import Corner from './components/corner'

export type LazyImageProps = {
  /**
   * 图片信息
   */
  image: ImageType
  /**
   * 点击预览回调
   * NOTE: 需要把右键中的preview功能开启
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
   * 透传给 antd Image 组件的 props
   */
  antdImageProps: ImageProps
  /**
   * 透传给 ImageName 组件的props
   */
  imageNameProps?: ImageNameProps
  /**
   * 图片选中
   */
  selected?: boolean
  /**
   * 图片状态改变回调
   */
  onSelectedChange?: (image: ImageType, active: boolean) => void
  /**
   * 处于多选状态
   */
  isMultipleSelecting?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => boolean
  /**
   * 交互样式 (hover，selected)
   */
  interactive?: boolean
  /**
   * className
   */
  className?: (image: ImageType) => string
  /**
   * 是否是viewer中的图片
   */
  inViewer?: boolean
}

function LazyImage(props: LazyImageProps) {
  const {
    image,
    onPreviewClick,
    lazy = {
      root: getAppRoot(),
    },
    onRemoveClick,
    removeRender = (n) => n,
    antdImageProps,
    imageNameProps,
    onContextMenu,
    isMultipleSelecting = () => false,
    interactive = true,
    className,
    inViewer,
  } = props

  const root = lazy ? lazy.root : null

  const { t } = useTranslation()
  const [showImageDetails] = useImageDetails()

  const [selected, setSelected] = useControlledState<boolean>({
    value: props.selected,
    onChange(value) {
      props.onSelectedChange?.(image, value)
    },
  })

  const { hoverShowImageDetail } = SettingsStore.useStore(['hoverShowImageDetail'])
  const { imagePlaceholderSize, imageReveal, setImageReveal } = GlobalStore.useStore([
    'imagePlaceholderSize',
    'imageReveal',
    'setImageReveal',
  ])

  const imageWidth = GlobalStore.useStore((ctx) => ctx.extConfig.viewer.imageWidth)
  const warningSize = GlobalStore.useStore((ctx) => ctx.extConfig.viewer.warningSize)
  const imageRendering = GlobalStore.useStore((ctx) => ctx.extConfig.viewer.imageRendering)

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

  const sizeWarning = useMemo((): boolean => {
    if (!!warningSize && bytesToUnit(image.stats.size, 'KB') > warningSize) {
      return true
    }
    return false
  }, [image.stats.size, warningSize])

  const isTargetImage = useMemoizedFn(() => {
    // 在 viewer 中的图片才会被reveal
    return inViewer && trim(image.path).length && imageReveal.map(clearTimestamp).includes(image.path)
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
    let idleTimer: ReturnType<typeof requestIdleCallback>
    let scrolled = false

    if (isTargetImage()) {
      // 清除 imageReveal，避免重复选中
      setImageReveal([])

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
          setSelected(true)
        }
      }

      // 从explorer打开图片时，需要使用 requestIdleCallback
      idleTimer = requestIdleCallback(() => {
        callback()
      })
    }

    return () => {
      if (isTargetImage()) {
        setSelected(false)
        setImageReveal([])
        cancelIdleCallback(idleTimer)
      }
    }
  }, [imageReveal, image.path])

  /**
   * @param depth 父元素查找深度，默认向上查找3层，如果查不到 [data-disable-dbclick] 元素，则可以双击
   */
  const preventDbClick = useMemoizedFn((el: HTMLElement, depth: number = 3) => {
    let parent = el
    let count = 0
    while (parent) {
      if (count > depth) {
        return false
      }
      if (parent.getAttribute('data-disable-dbclick')) {
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
              'flex cursor-pointer items-center space-x-1 truncate transition-colors hover:text-ant-color-primary-text',
            )}
            onClick={(e) => {
              if (isMultipleSelecting(e)) return
              // prevent click away
              e.stopPropagation()
              e.preventDefault()
              onPreviewClick(image)
            }}
            data-disable-dbclick
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
    <div ref={elRef} className={classNames('select-none transition-opacity', className?.(image))}>
      {elInView || !lazy ? (
        <motion.div
          data-image-context-menu={true}
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
            if (isMultipleSelecting(e)) return
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
                {image.basename}
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
