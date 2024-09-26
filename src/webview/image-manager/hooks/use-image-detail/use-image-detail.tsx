import { useTranslation } from 'react-i18next'
import { useMemoizedFn } from 'ahooks'
import { App, Button, Descriptions, type DescriptionsProps } from 'antd'
import { HiOutlineViewfinderCircle } from 'react-icons/hi2'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '../../../vscode-api'
import { formatBytes } from '../../utils'
import styles from './index.module.css'

export default function useImageDetail() {
  const { t } = useTranslation()
  const { modal } = App.useApp()

  const showImageDetailModal = useMemoizedFn(
    (
      image: ImageType,
      options?: {
        onPreview?: (image: ImageType) => void
      },
    ) => {
      if (!image) return

      const {
        metadata: { width, height },
        compressed,
      } = image.info

      const { onPreview } = options || {}

      const descItems: DescriptionsProps['items'] = [
        {
          label: t('im.name'),
          children: (
            <div className={'flex items-center justify-between gap-x-1'}>
              <div className={'w-0 flex-1 truncate'}>{image.name}</div>
              {onPreview && (
                <Button
                  type={'text'}
                  icon={<HiOutlineViewfinderCircle className={'flex-none text-xl'} />}
                  title={t('im.preview')}
                  onClick={() => {
                    modalInstance.destroy()
                    onPreview && onPreview(image)
                  }}
                ></Button>
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
                  {width} x {height}
                </div>
              ),
            }
          : (null as any),
        {
          label: t('im.size'),
          children: <div>{formatBytes(image.stats.size)}</div>,
        },
        {
          label: t('im.whether_compressed'),
          children: (
            <div className={'flex items-center justify-between'}>
              <div>{compressed ? `✅ ${t('im.yes')}` : `❎ ${t('im.no')}`}</div>
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

      const modalInstance = modal.confirm({
        width: 500,
        icon: null,
        closable: true,
        title: t('im.image_detail'),
        className: styles.detail_modal,
        centered: true,
        content: (
          <Descriptions
            className={'mt-2'}
            layout='horizontal'
            column={1}
            size='small'
            title={null}
            bordered
            items={descItems.map((item, index) => ({ key: index, ...item }))}
          />
        ),
        footer: null,
      })
    },
  )

  return { showImageDetailModal }
}
