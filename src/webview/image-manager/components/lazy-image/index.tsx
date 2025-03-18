import { memo, type ReactNode, useRef } from 'react'
import { useInViewport, useMemoizedFn } from 'ahooks'
import { type ImageProps } from 'antd'
import { classNames } from 'tw-clsx'
import { DEFAULT_CONFIG } from '~/core/config/common'
import { getAppRoot } from '~/webview/utils'
import GlobalStore from '../../stores/global-store'
import { type ImageNameProps } from '../image-name'
import VisibleImage from './components/visible-image'

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
    lazy = {
      root: getAppRoot(),
    },
    className,
    ...rest
  } = props

  const root = lazy ? lazy.root : null

  const { imagePlaceholderSize } = GlobalStore.useStore(['imagePlaceholderSize'])

  const rootMargin = useMemoizedFn(
    (rate: number) => `${(imagePlaceholderSize?.height || DEFAULT_CONFIG.viewer.imageWidth) * rate}px 0px`,
  ) // expand area of vertical intersection calculation

  const elRef = useRef<HTMLDivElement>(null)

  const [elInView] = useInViewport(elRef, {
    root,
    rootMargin: rootMargin(4.5),
  })

  // 懒加载图片
  // 比 VisibleImage 的加载更多，为了更快读取图片
  const [imageInView] = useInViewport(elRef, {
    root,
    rootMargin: rootMargin(10),
  })

  // 渲染优化
  if (lazy && !lazy.root) {
    return null
  }

  return (
    <div ref={elRef} className={classNames('select-none transition-opacity', className?.(image))}>
      {elInView || !lazy ? (
        // 拆出去为了更好的渲染性能
        <VisibleImage {...rest} image={image} />
      ) : (
        <div
          style={{
            width: imagePlaceholderSize?.width,
            height: imagePlaceholderSize?.height,
          }}
        >
          {imageInView && <img src={image.vscodePath} hidden={true} className={'h-0 w-0'} />}
        </div>
      )}
    </div>
  )
}

export default memo(LazyImage)
