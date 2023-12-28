import { useControlledState } from '@minko-fe/react-hook'
import { CmdToVscode } from '@root/bridge/constant'
import { webviewToVscodeBridge } from '@root/bridge/webview-to-vscode-bridge'
import { App, Badge, Button, Image, type ImageProps, Tooltip } from 'antd'
import classNames from 'classnames'
import { motion } from 'framer-motion'
import { memo, useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { BsCopy } from 'react-icons/bs'
import { FaImages } from 'react-icons/fa6'
import { ImEyePlus } from 'react-icons/im'
import { PiFileImage } from 'react-icons/pi'
import { type ImageType } from '../..'
import { WARNING_MAX, bytesToKb, formatBytes } from '../../utils'

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
      webviewToVscodeBridge.postMessage(
        { cmd: CmdToVscode.GET_IMAGE_DIMENSIONS, data: { filePath: info.path } },
        (data) => {
          setDimensions(data)
        },
      )
    }
  }

  const ifWarning = bytesToKb(info.stats.size) > WARNING_MAX

  return (
    <motion.div
      className={'flex flex-none flex-col items-center space-y-1 transition-[width_height]'}
      initial={{ opacity: 0.8 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1 }}
      style={{ width: image.width }}
      transition={{ duration: 0.1 }}
    >
      <Badge status='warning' dot={ifWarning}>
        <Image
          {...image}
          className={'rounded-md object-contain'}
          preview={{
            mask: (
              <div
                className={'flex-col-center h-full w-full justify-center space-y-1 text-xs'}
                onMouseOver={handleMaskMouseOver}
              >
                <div
                  className={'flex-center cursor-pointer space-x-1'}
                  onClick={() => setPreview({ open: true, current: index })}
                >
                  <ImEyePlus />
                  <span>Preview</span>
                </div>
                <div className={'flex-center space-x-1'}>
                  <PiFileImage />
                  <span className={classNames(ifWarning && 'text-ant-color-warning-text')}>
                    {formatBytes(info.stats.size)}
                  </span>
                </div>
                <div className={'flex-center space-x-1'}>
                  <FaImages />
                  <span>
                    {dimensions?.width} x {dimensions?.height}
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
        <div className={'max-w-full truncate'}>{info.name}</div>
      </Tooltip>
    </motion.div>
  )
}

export default memo(LazyImage)
