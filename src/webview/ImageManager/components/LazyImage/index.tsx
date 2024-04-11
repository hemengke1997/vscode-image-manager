import { useControlledState, useInViewport, useUpdateEffect } from '@minko-fe/react-hook'
import { Badge, Image, type ImageProps } from 'antd'
import { motion } from 'framer-motion'
import { type ReactNode, memo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { FaRegGrinStars } from 'react-icons/fa'
import { HiOutlineViewfinderCircle } from 'react-icons/hi2'
import { MdOutlineRemoveCircle } from 'react-icons/md'
import { RxDimensions } from 'react-icons/rx'
import { TbResize } from 'react-icons/tb'
import { Key } from 'ts-key-enum'
import { type SharpNS } from '~/@types/global'
import { CmdToVscode } from '~/message/cmd'
import useImageDetail from '~/webview/ImageManager/hooks/useImageDetail/useImageDetail'
import { cn } from '~/webview/utils'
import { vscodeApi } from '~/webview/vscode-api'
import ActionContext from '../../contexts/ActionContext'
import GlobalContext from '../../contexts/GlobalContext'
import useImageContextMenu, { type ImageContextMenuType } from '../../hooks/useImageContextMenu'
import useImageOperation from '../../hooks/useImageOperation'
import { bytesToKb, formatBytes } from '../../utils'
import { ANIMATION_DURATION } from '../../utils/duration'
import ImageName from '../ImageName'

export type LazyImageProps = {
  imageProp: ImageProps
  image: ImageType
  index?: number
  preview?: {
    open?: boolean
    current?: number
  }
  onPreviewChange?: (preview: { open?: boolean; current?: number }) => void
  /**
   * 是否懒加载
   */
  lazy?: boolean
  onRemoveClick?: (image: ImageType) => void
  removeRender?: (children: ReactNode, image: ImageType) => ReactNode
  /**
   * 图片右键上下文
   */
  contextMenu:
    | (Omit<ImageContextMenuType, 'image'> & {
        /**
         * TODO
         * @description 来源
         * 根据来源追踪事件链路
         */
        source?: 'similarity'
      })
    | undefined
  tooltipDisplayFullPath?: boolean
}

function LazyImage(props: LazyImageProps) {
  const {
    imageProp,
    image,
    preview,
    onPreviewChange,
    index,
    lazy = true,
    onRemoveClick,
    removeRender = (n) => n,
    contextMenu,
    tooltipDisplayFullPath,
  } = props

  const { beginRenameProcess, beginDeleteProcess } = useImageOperation()
  const { t } = useTranslation()
  const { showImageDetailModal } = useImageDetail()

  const { imagePlaceholderSize } = GlobalContext.usePicker(['imagePlaceholderSize'])
  const warningSize = GlobalContext.useSelector((ctx) => ctx.extConfig.viewer.warningSize)

  const refreshTimes = ActionContext.useSelector((ctx) => ctx.imageRefreshedState.refreshTimes)

  const placeholderRef = useRef<HTMLDivElement>(null)
  const [inViewport] = useInViewport(placeholderRef, {
    rootMargin: '100px 0px', // expand 100px area of vertical intersection calculation
  })

  const [, setPreview] = useControlledState({
    defaultValue: preview,
    value: preview,
    onChange: onPreviewChange,
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
      switch (e.code) {
        case Key.Enter: {
          hideAll()
          beginRenameProcess(image, contextMenu?.sameDirImages || [])
          return
        }
        case Key.Backspace: {
          hideAll()
          beginDeleteProcess(image)
          return
        }
        default:
          break
      }
    },
    {
      enabled: inViewport,
    },
  )

  const ifWarning = bytesToKb(image.stats.size) > warningSize

  const { show, hideAll } = useImageContextMenu()

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
        className={cn(
          'group relative flex flex-none flex-col items-center space-y-1 p-1.5 transition-colors',
          'hover:border-ant-color-primary focus:border-ant-color-primary overflow-hidden rounded-md border-[1px] border-solid border-transparent',
        )}
        initial={{ opacity: 0 }}
        viewport={{ once: true, margin: '20px 0px' }}
        transition={{ duration: ANIMATION_DURATION.slow }}
        whileInView={{ opacity: 1 }}
        onContextMenu={(e) => {
          show({
            event: e,
            props: {
              image,
              sameWorkspaceImages: contextMenu?.sameWorkspaceImages || [],
              sameLevelImages: contextMenu?.sameLevelImages || [],
              sameDirImages: contextMenu?.sameDirImages || [],
            },
          })
        }}
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
            {...imageProp}
            className={cn('rounded-md object-contain p-1 will-change-auto', imageProp.className)}
            preview={
              lazy
                ? {
                    mask: (
                      <div className={'flex size-full flex-col items-center justify-center space-y-1 text-sm'}>
                        <div
                          className={'flex cursor-pointer items-center space-x-1 truncate'}
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreview({ open: true, current: index })
                          }}
                        >
                          <HiOutlineViewfinderCircle />
                          <span>{t('im.preview')}</span>
                        </div>
                        <div className={'flex items-center space-x-1 truncate'}>
                          <TbResize />
                          <span className={cn(ifWarning && 'text-ant-color-warning-text')}>
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
            rootClassName={cn('transition-all', imageProp.rootClassName)}
            style={{ width: imageProp.width, height: imageProp.height, ...imageProp.style }}
          ></Image>
        </Badge>
        <div className='max-w-full truncate' style={{ maxWidth: imageProp.width }}>
          {image.nameElement || (
            <ImageName image={image} showFullPath={tooltipDisplayFullPath}>
              {image.name}
            </ImageName>
          )}
        </div>
      </motion.div>
    </>
  )
}

export default memo(LazyImage)
