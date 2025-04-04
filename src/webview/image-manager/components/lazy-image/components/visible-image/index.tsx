import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FiCheckCircle } from 'react-icons/fi'
import { HiOutlineViewfinderCircle } from 'react-icons/hi2'
import { MdOutlineRemoveCircle } from 'react-icons/md'
import { RiErrorWarningLine } from 'react-icons/ri'
import { RxDimensions } from 'react-icons/rx'
import { TbResize } from 'react-icons/tb'
import { useMemoizedFn } from 'ahooks'
import { Image } from 'antd'
import { classNames } from 'tw-clsx'
import { DEFAULT_CONFIG } from '~/core/config/common'
import { Compressed } from '~/enums'
import useImageDetails from '~/webview/image-manager/hooks/use-image-details/use-image-details'
import GlobalStore from '~/webview/image-manager/stores/global-store'
import SettingsStore from '~/webview/image-manager/stores/settings-store'
import { bytesToUnit, formatBytes } from '~/webview/image-manager/utils'
import { type LazyImageProps } from '../..'
import ImageName from '../../../image-name'
import Corner from '../corner'

type VisibleImageProps = {} & Omit<LazyImageProps, keyof Pick<LazyImageProps, 'lazy' | 'className' | 'inViewer'>>

function VisibleImage(props: VisibleImageProps) {
  const {
    image,
    selected,
    onPreviewClick,
    onRemoveClick,
    removeRender = (n) => n,
    antdImageProps,
    imageNameProps,
    onContextMenu,
    isMultipleSelecting = () => false,
    interactive = true,
  } = props

  const { t } = useTranslation()
  const [showImageDetails] = useImageDetails()

  const { hoverShowImageDetail } = SettingsStore.useStore(['hoverShowImageDetail'])

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

  const imageMetadata = useMemo(() => {
    return {
      compressed: image.info.compressed,
      metadata: image.info.metadata,
    }
  }, [image.info.compressed, image.info.metadata])

  const sizeWarning = useMemo((): boolean => {
    if (!!warningSize && bytesToUnit(image.stats.size, 'KB') > warningSize) {
      return true
    }
    return false
  }, [image.stats.size, warningSize])

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
              'flex items-center space-x-1 truncate transition-colors',
              'cursor-pointer hover:text-ant-color-primary-text',
            )}
            onClick={(e) => {
              if (isMultipleSelecting(e)) return
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

  const imagePreivew = useMemoizedFn(() => {
    if (hoverShowImageDetail) {
      return {
        mask: previewMask(),
        maskClassName: 'rounded-md !cursor-default !transition-none',
        className: 'min-w-24',
        src: antdImageProps.src,
        movable: false,
      }
    }

    return false
  })

  const compressedMap = useMemo(
    () => ({
      [Compressed.yes]: <FiCheckCircle className={'text-sm text-ant-color-text'} title={t('im.compressed')} />,
    }),
    [t],
  )

  return (
    <div
      data-image-context-menu={true}
      tabIndex={-1}
      className={classNames(
        'group relative flex flex-none flex-col items-center space-y-1 p-2',
        'overflow-hidden rounded-lg border-[2px] border-solid border-transparent',
        interactive && 'hover:border-ant-color-border',
        interactive && selected && 'border-ant-color-primary-hover hover:border-ant-color-primary-hover',
      )}
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
          preview={imagePreivew()}
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
    </div>
  )
}

export default memo(VisibleImage)
