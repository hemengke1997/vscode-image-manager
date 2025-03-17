import { memo, type ReactNode, useMemo, useRef } from 'react'
import { useInViewport } from 'ahooks'
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

  const rootMargin = useMemo(
    () => `${(imagePlaceholderSize?.height || DEFAULT_CONFIG.viewer.imageWidth) * 4.5}px 0px`,
    [imagePlaceholderSize?.height],
  ) // expand area of vertical intersection calculation

  const elRef = useRef<HTMLDivElement>(null)

  const [elInView] = useInViewport(elRef, {
    root,
    rootMargin,
  })

  // 目前 motion/react viewport root 有bug，在 root 改变后不会重新observe
  // 所以这里需要判断 root 是否存在
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
        ></div>
      )}
    </div>
  )
}

export default memo(LazyImage)
