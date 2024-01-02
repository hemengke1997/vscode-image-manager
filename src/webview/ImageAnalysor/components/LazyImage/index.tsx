import { useControlledState, useInViewport } from '@minko-fe/react-hook'
import { CmdToVscode } from '@root/message/shared'
import { vscodeApi } from '@root/webview/vscode-api'
import { App, Badge, Button, Image, type ImageProps, Tooltip } from 'antd'
import classNames from 'classnames'
import { motion } from 'framer-motion'
import { memo, useRef, useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { useTranslation } from 'react-i18next'
import { BsCopy } from 'react-icons/bs'
import { FaImages } from 'react-icons/fa6'
import { ImEyePlus } from 'react-icons/im'
import { PiFileImage } from 'react-icons/pi'
import { type ImageType } from '../..'
import ImageAnalysorContext from '../../contexts/ImageAnalysorContext'
import { bytesToKb, formatBytes } from '../../utils'

type LazyImageProps = {
  image: ImageProps
  info: ImageType
  index: number
  preview?: {
    open?: boolean
    current?: number
  }
  onPreviewChange: (preview: { open?: boolean; current?: number }) => void
}

function LazyImage(props: LazyImageProps) {
  const { image, info, preview, onPreviewChange, index } = props

  const { t } = useTranslation()

  const { config } = ImageAnalysorContext.usePicker(['config'])

  const placeholderRef = useRef<HTMLDivElement>(null)
  const [inViewport] = useInViewport(placeholderRef, {
    rootMargin: '60px 0px', // expand 60px area of vertical intersection calculation
  })
  const { message } = App.useApp()

  const [copied, setCopied] = useState(false)

  const [, setPreview] = useControlledState({
    defaultValue: preview,
    value: preview,
    onChange: onPreviewChange,
  })

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>()

  const handleMaskMouseOver = () => {
    if (!dimensions) {
      vscodeApi.postMessage({ cmd: CmdToVscode.GET_IMAGE_DIMENSIONS, data: { filePath: info.path } }, (data) => {
        setDimensions(data)
      })
    }
  }

  const clns = {
    containerClassName: 'flex flex-none flex-col items-center space-y-1 transition-[width_height]',
    imageClassName: 'rounded-md object-contain transition-colors p-1',
    nameClassName: 'max-w-full truncate',
  }

  if (!inViewport) {
    return (
      <div ref={placeholderRef} className={clns.containerClassName}>
        <div className={clns.imageClassName} style={{ width: image.width, height: image.height }}></div>
        <div className={classNames(clns.nameClassName, 'invisible')}>{info.name}</div>
      </div>
    )
  }

  const ifWarning = bytesToKb(info.stats.size) > config.warningSize

  return (
    <motion.div
      className={clns.containerClassName}
      initial={{ opacity: 0 }}
      viewport={{ once: true, margin: '20px 0px' }}
      transition={{ duration: 0.8 }}
      whileInView={{ opacity: 1 }}
      style={{ width: image.width }}
    >
      <Badge status='warning' dot={ifWarning}>
        <Image
          {...image}
          className={classNames(clns.imageClassName)}
          preview={{
            mask: (
              <div
                className={'flex-col-center h-full w-full justify-center space-y-1 text-xs'}
                onMouseOver={handleMaskMouseOver}
              >
                <div
                  className={'flex-center cursor-pointer space-x-1 truncate'}
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreview({ open: true, current: index })
                  }}
                >
                  <ImEyePlus />
                  <span>{t('ns.preview')}</span>
                </div>
                <div className={'flex-center space-x-1 truncate'}>
                  <PiFileImage />
                  <span className={classNames(ifWarning && 'text-ant-color-warning-text')}>
                    {formatBytes(info.stats.size)}
                  </span>
                </div>
                <div className={'flex-center space-x-1 truncate'}>
                  <FaImages />
                  <span>
                    {dimensions?.width}x{dimensions?.height}
                  </span>
                </div>
              </div>
            ),
            maskClassName: 'rounded-md !cursor-auto',
          }}
        ></Image>
      </Badge>
      <Tooltip
        mouseEnterDelay={0.03}
        mouseLeaveDelay={0.05}
        overlayClassName={'max-w-full'}
        title={
          <div className={'flex items-center space-x-2'}>
            <span className={'flex-none'}>{info.name}</span>
            <CopyToClipboard
              text={info.name}
              onCopy={() => {
                if (copied) return
                setCopied(true)
                message.success('Copy Successfully')
              }}
            >
              <Button type={'primary'} disabled={copied} size='small' className={'flex-center cursor-pointer'}>
                <BsCopy />
              </Button>
            </CopyToClipboard>
          </div>
        }
        arrow={false}
        placement='bottom'
        destroyTooltipOnHide={false}
        afterOpenChange={(open) => {
          if (!open) {
            setCopied(false)
          }
        }}
      >
        <div className={clns.nameClassName}>{info.name}</div>
      </Tooltip>
    </motion.div>
  )
}

export default memo(LazyImage)
