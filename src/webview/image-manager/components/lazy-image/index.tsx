import { trim } from '@minko-fe/lodash-pro'
import { useControlledState, useInViewport, useMemoizedFn, useUpdateEffect } from '@minko-fe/react-hook'
import { Badge, Image, type ImageProps } from 'antd'
import { motion } from 'framer-motion'
import { type ReactNode, memo, useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { FaRegGrinStars } from 'react-icons/fa'
import { HiOutlineViewfinderCircle } from 'react-icons/hi2'
import { MdOutlineRemoveCircle } from 'react-icons/md'
import { RxDimensions } from 'react-icons/rx'
import { TbResize } from 'react-icons/tb'
import { animateScroll } from 'react-scroll'
import { Key } from 'ts-key-enum'
import classnames from 'tw-clsx'
import { type SharpNS } from '~/@types/global'
import { DEFAULT_CONFIG } from '~/core/config/common'
import { CmdToVscode } from '~/message/cmd'
import { getAppRoot } from '~/webview/utils'
import { vscodeApi } from '~/webview/vscode-api'
import ActionContext from '../../contexts/action-context'
import GlobalContext from '../../contexts/global-context'
import useImageDetail from '../../hooks/use-image-detail/use-image-detail'
import useImageOperation from '../../hooks/use-image-operation'
import { bytesToKb, formatBytes } from '../../utils'
import { ANIMATION_DURATION } from '../../utils/duration'
import useImageContextMenu, {
  type ImageContextMenuType,
} from '../context-menus/components/image-context-menu/hooks/use-image-context-menu'
import ImageName, { type ImageNameProps } from '../image-name'

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
   *   root: null
   * }
   */
  lazy?:
    | false
    | {
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
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void
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
  onActiveChange?: (active: boolean) => void
  /**
   * 多选状态
   */
  multipleSelect?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => boolean
}

function LazyImage(props: LazyImageProps) {
  const {
    image,
    onPreviewClick,
    lazy = {
      root: null,
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
  } = props

  const root = lazy ? lazy.root : null
  const { beginRenameImageProcess, beginDeleteImageProcess, handleCopyString } = useImageOperation()
  const { t } = useTranslation()
  const { showImageDetailModal } = useImageDetail()

  const [interactive, setInteractive] = useControlledState<boolean>({
    defaultValue: active,
    value: active,
    onChange(value) {
      onActiveChange?.(value)
    },
  })

  const { imagePlaceholderSize, imageReveal, imageRevealWithoutQuery } = GlobalContext.usePicker([
    'imagePlaceholderSize',
    'imageReveal',
    'imageRevealWithoutQuery',
  ])
  const warningSize = GlobalContext.useSelector((ctx) => ctx.extConfig.viewer.warningSize)
  const imageRendering = GlobalContext.useSelector((ctx) => ctx.extConfig.viewer.imageRendering)
  const refreshTimes = ActionContext.useSelector((ctx) => ctx.imageRefreshedState.refreshTimes)

  const rootMargin = `${(imagePlaceholderSize?.height || DEFAULT_CONFIG.viewer.imageWidth) * 2.5}px 0px` // expand area of vertical intersection calculation

  const elRef = useRef<HTMLDivElement>(null)

  const [imageMetadata, setImageMeatadata] = useState<{ metadata: SharpNS.Metadata; compressed: boolean }>()

  const handleMaskMouseOver = () => {
    if (!imageMetadata) {
      vscodeApi.postMessage({ cmd: CmdToVscode.get_image_metadata, data: { filePath: image.path } }, (data) => {
        if (data) {
          const { metadata, compressed } = data
          setImageMeatadata({ metadata, compressed })
        }
      })
    }
  }

  useUpdateEffect(() => {
    // clear cache
    setImageMeatadata(undefined)
  }, [refreshTimes])

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

  const keybindRef = useHotkeys<HTMLDivElement>(
    [Key.Enter, `mod+${Key.Backspace}`, Key.Delete, `mod+c`],
    (e) => {
      if (contextMenu?.enable?.fs) {
        switch (e.key) {
          case Key.Enter: {
            hideAll()
            beginRenameImageProcess(image)
            return
          }
          // mac delete key
          case Key.Backspace: {
            handleDelete()
            return
          }
          // windows delete key
          case Key.Delete: {
            handleDelete()
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
      enabled: elInView,
    },
  )

  const ifWarning = !!warningSize && bytesToKb(image.stats.size) > warningSize

  const { hideAll } = useImageContextMenu()

  const isTargetImage = useMemoizedFn(() => {
    return !contextMenu?.enable?.reveal_in_viewer && trim(image.path).length && image.path === imageRevealWithoutQuery
  })

  useEffect(() => {
    let idleTimer: number

    if (isTargetImage()) {
      setInteractive(true)

      // 清空 imageReveal，避免下次进入时直接定位
      vscodeApi.postMessage({ cmd: CmdToVscode.reveal_image_in_viewer, data: { filePath: '' } })

      idleTimer = requestIdleCallback(() => {
        const y = elRef.current?.getBoundingClientRect().top

        const clientHeight = document.documentElement.clientHeight

        if (y) {
          animateScroll.scrollTo(
            y + getAppRoot().scrollTop - clientHeight / 2 + (imagePlaceholderSize?.height || 0) / 2,
            {
              duration: 0,
              smooth: true,
              delay: 0,
              containerId: 'root',
            },
          )
        }
      })
    } else if (imageReveal) {
      setInteractive(false)
    }

    return () => {
      if (isTargetImage()) {
        setInteractive(false)
        cancelIdleCallback(idleTimer)
      }
    }
  }, [imageReveal])

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

  return (
    <div ref={elRef} className={'select-none'}>
      {elInView || !lazy ? (
        <motion.div
          ref={keybindRef}
          tabIndex={-1}
          className={classnames(
            'group relative flex flex-none flex-col items-center space-y-1 p-1.5 transition-colors',
            'hover:border-ant-color-primary overflow-hidden rounded-md border-[2px] border-solid border-transparent',
            interactive && 'border-ant-color-primary-hover hover:border-ant-color-primary-hover',
          )}
          initial={{ opacity: 0 }}
          viewport={{
            once: true,
            margin: rootMargin,
            root: { current: root },
          }}
          transition={{ duration: ANIMATION_DURATION.middle }}
          whileInView={{ opacity: 1 }}
          onContextMenu={onContextMenu}
          onMouseOver={handleMaskMouseOver}
          onDoubleClick={(e) => {
            if (multipleSelect(e)) return
            const el = e.target as HTMLElement
            if (preventDbClick(el)) return
            showImageDetailModal(image)
          }}
        >
          {onRemoveClick && (
            <div
              className={
                'text-ant-color-error absolute left-0 top-0 z-[99] cursor-pointer opacity-0 transition-opacity group-hover:opacity-100'
              }
              onClick={(e) => {
                // prevent click away
                e.stopPropagation()
                onRemoveClick(image)
              }}
              title={t('im.remove')}
            >
              {removeRender(<MdOutlineRemoveCircle />, image)}
            </div>
          )}
          <Badge status='warning' dot={ifWarning}>
            <Image
              {...antdImageProps}
              className={classnames('rounded-md object-contain p-1 will-change-auto', antdImageProps.className)}
              preview={
                lazy
                  ? {
                      mask: (
                        <div className={'flex size-full flex-col items-center justify-center space-y-1 text-sm'}>
                          {onPreviewClick && (
                            <div
                              className={classnames('flex cursor-pointer items-center space-x-1 truncate')}
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
                            <span className={classnames(ifWarning && 'text-ant-color-warning-text')}>
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
                          {imageMetadata?.compressed ? (
                            <div className={'flex items-center space-x-1 truncate'}>
                              <FaRegGrinStars />
                              <span>{t('im.compressed')}</span>
                            </div>
                          ) : null}
                        </div>
                      ),
                      maskClassName: 'rounded-md !cursor-default',
                      className: 'min-w-24',
                    }
                  : false
              }
              rootClassName={classnames('transition-all', antdImageProps.rootClassName)}
              style={{
                imageRendering,
                ...antdImageProps.style,
              }}
            ></Image>
          </Badge>
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
