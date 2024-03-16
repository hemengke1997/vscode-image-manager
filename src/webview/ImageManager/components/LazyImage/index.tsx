import { useControlledState, useInViewport, useUpdateEffect } from '@minko-fe/react-hook'
import { Badge, Image, type ImageProps } from 'antd'
import classNames from 'classnames'
import { motion } from 'framer-motion'
import { memo, useRef, useState } from 'react'
import { useContextMenu } from 'react-contexify'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { FaRegGrinStars } from 'react-icons/fa'
import { HiOutlineViewfinderCircle } from 'react-icons/hi2'
import { MdOutlineRemoveCircle } from 'react-icons/md'
import { RxDimensions } from 'react-icons/rx'
import { TbResize } from 'react-icons/tb'
import { type SharpNS } from '~/@types/global'
import { CmdToVscode } from '~/message/cmd'
import useImageDetail from '~/webview/ImageManager/hooks/useImageDetail/useImageDetail'
import { vscodeApi } from '~/webview/vscode-api'
import { type ImageType } from '../..'
import ActionContext from '../../contexts/ActionContext'
import GlobalContext from '../../contexts/GlobalContext'
import { bytesToKb, formatBytes } from '../../utils'
import { IMAGE_CONTEXT_MENU_ID } from '../ContextMenus/components/ImageContextMenu'

export type LazyImageProps = {
  imageProp: ImageProps
  image: ImageType
  index?: number
  preview?: {
    open?: boolean
    current?: number
  }
  onPreviewChange?: (preview: { open?: boolean; current?: number }) => void

  lazy?: boolean
  onRemoveClick?: (image: ImageType) => void
  contextMenu?: {
    /**
     * @description whether to show operation menu
     */
    operable?: boolean
  }
}

function LazyImage(props: LazyImageProps) {
  const { imageProp, image, preview, onPreviewChange, index, lazy = true, onRemoveClick, contextMenu } = props

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
        const { metadata, compressed } = data
        setImageMeatadata({ metadata, compressed })
      })
    }
  }

  useUpdateEffect(() => {
    // clear cache
    setImageMeatadata(undefined)
  }, [refreshTimes])

  const keybindRef = useHotkeys<HTMLDivElement>(`mod+c`, () => {}, {
    enabled: inViewport,
  })

  const ifWarning = bytesToKb(image.stats.size) > warningSize

  const { show } = useContextMenu<{ image: ImageType }>()

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
        className={classNames(
          'flex flex-none flex-col items-center p-1.5 space-y-1 transition-colors relative group',
          'overflow-hidden border-[1px] border-solid border-transparent rounded-md hover:border-ant-color-primary focus:border-ant-color-primary',
        )}
        initial={{ opacity: 0 }}
        viewport={{ once: true, margin: '20px 0px' }}
        transition={{ duration: 0.8 }}
        whileInView={{ opacity: 1 }}
        onContextMenu={(e) => {
          show({ event: e, id: IMAGE_CONTEXT_MENU_ID, props: { image, ...contextMenu } })
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
            <MdOutlineRemoveCircle />
          </div>
        )}
        <Badge status='warning' dot={ifWarning}>
          <Image
            {...imageProp}
            className={classNames('rounded-md object-contain p-1 will-change-auto', imageProp.className)}
            preview={
              lazy
                ? {
                    mask: (
                      <div className={'flex-col-center size-full justify-center space-y-1 text-sm'}>
                        <div
                          className={'flex-center cursor-pointer space-x-1 truncate'}
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreview({ open: true, current: index })
                          }}
                        >
                          <HiOutlineViewfinderCircle />
                          <span>{t('im.preview')}</span>
                        </div>
                        <div className={'flex-center space-x-1 truncate'}>
                          <TbResize />
                          <span className={classNames(ifWarning && 'text-ant-color-warning-text')}>
                            {formatBytes(image.stats.size)}
                          </span>
                        </div>
                        <div className={'flex-center space-x-1 truncate'}>
                          <RxDimensions />
                          <span className={'flex items-center'}>
                            {imageMetadata?.metadata.width}x{imageMetadata?.metadata.height}
                          </span>
                        </div>
                        {imageMetadata?.compressed ? (
                          <div className={'flex-center space-x-1 truncate'}>
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
            rootClassName={classNames('transition-all', imageProp.rootClassName)}
            style={{ width: imageProp.width, height: imageProp.height, ...imageProp.style }}
          ></Image>
        </Badge>
        <div className='max-w-full cursor-default truncate' title={image.name} style={{ maxWidth: imageProp.width }}>
          {image.nameElement || image.name}
        </div>
      </motion.div>
    </>
  )
}

export default memo(LazyImage)
