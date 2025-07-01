import type { GetProps, ImageProps } from 'antd'
import type { ReactNode } from 'react'
import type ImageName from '../image-name'
import { useInViewport, useMemoizedFn } from 'ahooks'
import { trim } from 'es-toolkit'
import { useAtomValue } from 'jotai'
import { memo, useEffect, useRef } from 'react'
import { animateScroll } from 'react-scroll'
import logger from '~/utils/logger'
import { useControlledState } from '~/webview/image-manager/hooks/use-controlled-state'
import { classNames } from '~/webview/image-manager/utils/tw-clsx'
import { getAppRoot } from '~/webview/utils'
import useImageManagerEvent, { IMEvent } from '../../hooks/use-image-manager-event'
import { GlobalAtoms } from '../../stores/global/global-store'
import { clearTimestamp, isElInViewport } from '../../utils'
import { useLazyMargin } from '../image-group/use-lazy-load-images'
import VisibleImage from './components/visible-image'

type Props = {
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
  imageNameProps?: GetProps<typeof ImageName>
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

function LazyImage(props: Props) {
  const {
    image,
    lazy,
    className,
    inViewer,
    ...rest
  } = props

  const root = lazy ? (lazy.root || getAppRoot()) : null

  const [selected, setSelected] = useControlledState<boolean>({
    value: props.selected,
    onChange(value) {
      props.onSelectedChange?.(image, value)
    },
  })

  const imagePlaceholderSize = useAtomValue(GlobalAtoms.imagePlaceholderSizeAtom)
  const imageReveal = useAtomValue(GlobalAtoms.imageRevealAtom)

  const { rootVerticalMargin } = useLazyMargin()
  const elRef = useRef<HTMLDivElement>(null)

  const [elInView] = useInViewport(elRef, {
    root,
    rootMargin: `${rootVerticalMargin(4.5)}px 0px`,
  })

  // 懒加载图片
  // 比 VisibleImage 的加载更多，为了更快读取图片
  const [imageInView] = useInViewport(elRef, {
    root,
    rootMargin: `${rootVerticalMargin(10)}px 0px`,
  })

  const isTargetImage = useMemoizedFn(() => {
    // 在 viewer 中的图片才会被reveal
    return inViewer && trim(image.path).length && clearTimestamp(imageReveal) === image.path
  })

  const { imageManagerEvent } = useImageManagerEvent()

  // 如果当前图片是用户右键打开的图片
  // 则滚动到图片位置
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    let scrolled = false

    if (isTargetImage()) {
      // 清除 imageReveal，避免重复选中
      imageManagerEvent.emit(IMEvent.clear_image_reveal)

      logger.debug('Reveal图片', image.path)

      // 刚打开时，图片可能还未加载，所以需要等待图片加载完成后再滚动
      const callback = () => {
        try {
          if (scrolled || isElInViewport(elRef.current)) {
            logger.debug('图片已在视口中，无需滚动', image.path)
            return
          }

          logger.debug('打开Reveal图片', image.path)

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
        }
        finally {
          setSelected(true)
        }
      }

      // 从explorer打开图片
      timer = setTimeout(() => {
        callback()
        imageManagerEvent.emit(IMEvent.clear_image_reveal)
      })
    }

    return () => {
      if (isTargetImage()) {
        logger.debug('清除Reveal图片')
        setSelected(false)
        imageManagerEvent.emit(IMEvent.clear_image_reveal)
        clearTimeout(timer)
      }
    }
  }, [imageReveal, image.path])

  // 渲染优化
  if (lazy && !lazy.root) {
    return null
  }

  return (
    <div ref={elRef} className={classNames('select-none transition-opacity', className?.(image))}>
      {elInView || !lazy
        ? (
            // 拆出去为了更好的渲染性能
            <VisibleImage {...rest} selected={selected} image={image} />
          )
        : (
            <div
              style={{
                width: imagePlaceholderSize?.width,
                height: imagePlaceholderSize?.height,
              }}
            >
              {imageInView && <img src={image.vscodePath} hidden={true} className='size-0' />}
            </div>
          )}
    </div>
  )
}

export default memo(LazyImage)
