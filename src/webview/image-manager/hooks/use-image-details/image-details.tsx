import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Descriptions, type DescriptionsProps, Tooltip } from 'antd'
import { HiOutlineViewfinderCircle } from 'react-icons/hi2'
import { Compressed } from '~/enums'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '~/webview/vscode-api'
import { formatBytes } from '../../utils'
import { type ImperativeModalProps } from '../use-imperative-modal'

type Props = {
  image: ImageType
  onPreview?: (image: ImageType) => void
}

function ImageDetails(props: Props & ImperativeModalProps) {
  const { image, onPreview, onClose } = props
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
      [Compressed.not_supported]: `❕ ${t('im.format_not_supported', { fileType: image.fileType })}`,
    }),
    [t, image.fileType],
  )

  const descItems: DescriptionsProps['items'] = [
    {
      label: t('im.name'),
      children: (
        <div className={'flex items-center justify-between gap-x-1'}>
          <div className={'w-0 flex-1 truncate'}>{image.name}</div>
          {onPreview && (
            <Tooltip title={t('im.preview')} arrow={false} placement={'bottom'}>
              <Button
                type={'text'}
                icon={<HiOutlineViewfinderCircle className={'flex-none text-xl'} />}
                onClick={() => {
                  onClose()
                  onPreview && onPreview(image)
                }}
              ></Button>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      label: t('im.workspace'),
      children: <div>{image.workspaceFolder}</div>,
    },
    {
      label: t('im.directory'),
      children: <div>{image.dirPath || '/'}</div>,
    },
    width && height
      ? {
          label: `${t('im.dimensions')}(px)`,
          children: (
            <div>
              {width} × {height}
            </div>
          ),
        }
      : undefined,
    {
      label: t('im.size'),
      children: <div>{formatBytes(image.stats.size)}</div>,
    },
    {
      label: t('im.whether_compressed'),
      children: (
        <div className={'flex items-center justify-between'}>
          <div>{compressedMap[compressed]}</div>
          {image.fileType === 'svg' ? (
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
          ) : null}
        </div>
      ),
    },
  ].filter((t) => !!t)

  return (
    <Descriptions
      className={'mt-2'}
      layout='horizontal'
      column={1}
      size='small'
      title={null}
      bordered
      items={descItems.map((item, index) => ({ key: index, ...item }))}
    />
  )
}

export default memo(ImageDetails)
