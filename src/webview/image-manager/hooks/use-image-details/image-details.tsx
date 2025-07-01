import type { DescriptionsProps, GetProps } from 'antd'

import type lazyImage from '../../components/lazy-image'
import type { ImperativeModalProps } from '~/webview/image-manager/hooks/use-imperative-antd-modal'
import { Button, Descriptions, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { HiOutlineViewfinderCircle } from 'react-icons/hi2'
import { CmdToVscode } from '~/message/cmd'
import { Compressed } from '~/meta'
import { classNames } from '~/webview/image-manager/utils/tw-clsx'
import { vscodeApi } from '~/webview/vscode-api'
import { formatBytes } from '../../utils'
import WithCopy from './components/with-copy'

import './index.css'

type Props = {
  image: ImageType
  onPreview?: GetProps<typeof lazyImage>['onPreviewClick']
}

function ImageDetails(props: Props & ImperativeModalProps) {
  const { image, onPreview, closeModal } = props
  const { t } = useTranslation()

  const {
    metadata: { width, height },
    compressed,
  } = image.info

  const compressedMap = useMemo(
    () => ({
      [Compressed.yes]: `✅ ${t('im.yes')}`,
      [Compressed.no]: `❎ ${t('im.no')}`,
      [Compressed.unknown]: `❔ ${t('im.unknown')}`,
      [Compressed.not_supported]: `❕ ${t('im.format_not_supported', { extname: image.extname })}`,
    }),
    [t, image.extname],
  )

  const descItems: DescriptionsProps['items'] = [
    {
      label: t('im.name'),
      children: (
        <div className='flex items-center justify-between gap-x-1'>
          <div className='w-0 flex-1 truncate'>
            <WithCopy>{image.basename}</WithCopy>
          </div>
          {onPreview && (
            <Tooltip title={t('im.preview')} arrow={false} placement='bottom'>
              <Button
                type='text'
                icon={<HiOutlineViewfinderCircle className='flex-none text-xl' />}
                onClick={() => {
                  closeModal()
                  onPreview && onPreview(image)
                }}
              >
              </Button>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      label: t('im.workspace'),
      children: <WithCopy>{image.workspaceFolder}</WithCopy>,
    },
    {
      label: t('im.directory'),
      children: <WithCopy>{image.dirPath || '/'}</WithCopy>,
    },
    width && height
      ? {
          label: `${t('im.dimensions')}(px)`,
          children: <WithCopy>{`${width} x ${height}`}</WithCopy>,
        }
      : undefined,
    {
      label: t('im.size'),
      children: <WithCopy>{formatBytes(image.stats.size)}</WithCopy>,
    },
    {
      label: t('im.status_changed_time'),
      children: <WithCopy>{dayjs(image.stats.mtimeMs).format('YYYY-MM-DD HH:mm:ss')}</WithCopy>,
    },
    {
      label: t('im.whether_compressed'),
      children: (
        <div className='flex items-center justify-between'>
          <div>{compressedMap[compressed]}</div>
          {image.extname === 'svg'
            ? (
                <>
                  <Button
                    onClick={() => {
                      vscodeApi.postMessage({
                        cmd: CmdToVscode.open_file_in_text_editor,
                        data: {
                          filePath: image.path,
                        },
                      })
                    }}
                  >
                    {t('im.view_svg')}
                  </Button>
                </>
              )
            : null}
        </div>
      ),
    },
  ].filter(t => !!t)

  return (
    <>
      <Descriptions
        className={classNames('mt-2', 'image-details')}
        layout='horizontal'
        column={1}
        size='small'
        title={null}
        bordered
        items={descItems.map((item, index) => ({ key: index, ...item }))}
      />
    </>
  )
}

export default memo(ImageDetails)
