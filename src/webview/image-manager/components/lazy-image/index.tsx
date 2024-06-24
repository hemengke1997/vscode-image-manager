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
import { Events, animateScroll } from 'react-scroll'
import { Key } from 'ts-key-enum'
import classnames from 'tw-clsx'
import { type SharpNS } from '~/@types/global'
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
   * @default true
   */
  lazy?: boolean
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
   * 图片右键上下文
   */
  contextMenu: Omit<ImageContextMenuType, 'images'> | undefined
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
}

function LazyImage(props: LazyImageProps) {
  const {
    image,
    onPreviewClick,
    lazy = true,
    onRemoveClick,
    removeRender = (n) => n,
    contextMenu,
    antdImageProps,
    imageNameProps,
    active,
    onActiveChange,
    onContextMenu,
  } = props

  const { beginRenameImageProcess, beginDeleteImageProcess } = useImageOperation()
  const { t } = useTranslation()
  const { showImageDetailModal } = useImageDetail()

  const [interactive, setInteractive] = useControlledState<boolean>({
    defaultValue: active,
    value: active,
    onChange(value) {
      onActiveChange?.(value)
    },
  })

  const { imagePlaceholderSize, targetImagePath } = GlobalContext.usePicker(['imagePlaceholderSize', 'targetImagePath'])
  const warningSize = GlobalContext.useSelector((ctx) => ctx.extConfig.viewer.warningSize)
  const imageRendering = GlobalContext.useSelector((ctx) => ctx.extConfig.viewer.imageRendering)
  const refreshTimes = ActionContext.useSelector((ctx) => ctx.imageRefreshedState.refreshTimes)

  const placeholderRef = useRef<HTMLDivElement>(null)
  const [inViewport] = useInViewport(placeholderRef, {
    rootMargin: '100px 0px', // expand 100px area of vertical intersection calculation
  })

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

  const keybindRef = useHotkeys<HTMLDivElement>(
    [Key.Enter, `mod+${Key.Backspace}`],
    (e) => {
      if (contextMenu?.enable?.fs) {
        switch (e.code) {
          case Key.Enter: {
            hideAll()
            beginRenameImageProcess(image)
            return
          }
          case Key.Backspace: {
            hideAll()
            beginDeleteImageProcess([image])
            return
          }
          default:
            break
        }
      }
    },
    {
      enabled: inViewport,
    },
  )

  const ifWarning = !!warningSize && bytesToKb(image.stats.size) > warningSize

  const { hideAll } = useImageContextMenu()

  const isTargetImage = useMemoizedFn(() => {
    return (
      !contextMenu?.enable?.reveal_in_viewer &&
      trim(image.path).length &&
      image.path === targetImagePath.slice(0, targetImagePath.lastIndexOf('?'))
    )
  })

  useEffect(() => {
    let timer: number
    let idleTimer: number
    if (isTargetImage()) {
      Events.scrollEvent.register('end', () => {
        timer = window.setTimeout(() => {
          setInteractive(true)
          // 清空 targetImagePath，避免下次进入时直接定位
          vscodeApi.postMessage({ cmd: CmdToVscode.reveal_image_in_viewer, data: { filePath: '' } })
        }, 0)
      })

      idleTimer = requestIdleCallback(() => {
        const y = placeholderRef.current?.getBoundingClientRect().top || keybindRef.current?.getBoundingClientRect().top

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
    }

    return () => {
      if (isTargetImage()) {
        setInteractive(false)
        Events.scrollEvent.remove('end')
        clearTimeout(timer)
        cancelIdleCallback(idleTimer)
      }
    }
  }, [targetImagePath])

  if (!inViewport && lazy) {
    return (
      <div
        ref={placeholderRef}
        style={{
          width: imagePlaceholderSize?.width,
          height: imagePlaceholderSize?.height,
        }}
      ></div>
    )
  }

  return (
    <>
      <motion.div
        ref={keybindRef}
        tabIndex={-1}
        className={classnames(
          'group relative flex flex-none flex-col items-center space-y-1 p-1.5 transition-colors',
          'hover:border-ant-color-primary focus:border-ant-color-primary focus-visibile:border-ant-color-primary overflow-hidden rounded-md border-[2px] border-solid border-transparent focus-visible:outline-none',
          interactive && 'border-ant-color-primary',
        )}
        initial={{ opacity: 0 }}
        viewport={{ once: true, margin: '20px 0px' }}
        transition={{ duration: ANIMATION_DURATION.slow }}
        whileInView={{ opacity: 1 }}
        onContextMenu={onContextMenu}
        onMouseOver={handleMaskMouseOver}
        onDoubleClick={() => {
          showImageDetailModal(image)
        }}
      >
        {onRemoveClick && (
          <div
            className={
              'text-ant-color-error absolute left-0 top-0 z-[99] cursor-pointer opacity-0 transition-opacity group-hover:opacity-100'
            }
            onClick={() => onRemoveClick(image)}
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
                            className={'flex cursor-pointer items-center space-x-1 truncate'}
                            onClick={(e) => {
                              e.stopPropagation()
                              onPreviewClick(image)
                            }}
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
                        <div className={'flex items-center space-x-1 truncate'}>
                          <RxDimensions />
                          <span className={'flex items-center'}>
                            {imageMetadata?.metadata.width}x{imageMetadata?.metadata.height}
                          </span>
                        </div>
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
    </>
  )
}

export default memo(LazyImage)
