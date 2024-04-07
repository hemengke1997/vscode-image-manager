import { useLockFn } from '@minko-fe/react-hook'
import { App, Descriptions, type DescriptionsProps, Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import { BsQuestionCircleFill } from 'react-icons/bs'
import { CmdToVscode } from '~/message/cmd'
import { type ImageType } from '../..'
import { vscodeApi } from '../../../vscode-api'
import { formatBytes } from '../../utils'
import styles from './index.module.css'

export default function useImageDetail() {
  const { t } = useTranslation()
  const { modal } = App.useApp()

  const showImageDetailModal = useLockFn((image: ImageType) => {
    if (!image) return Promise.resolve()

    return new Promise((resolve) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.get_image_metadata, data: { filePath: image.path } }, (data) => {
        const {
          metadata: { width, height },
          compressed,
        } = data

        const formatDate = (date: Date) => {
          return new Date(date).toLocaleDateString(undefined, {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        }

        const descItems: DescriptionsProps['items'] = [
          {
            label: t('im.name'),
            children: <div>{image.name}</div>,
          },
          {
            label: t('im.workspace'),
            children: <div>{image.workspaceFolder}</div>,
          },
          {
            label: t('im.directory'),
            children: <div>{image.dirPath || '/'}</div>,
          },
          {
            label: `${t('im.dimensions')}(px)`,
            children: (
              <div>
                {width} x {height}
              </div>
            ),
          },
          {
            label: t('im.size'),
            children: <div>{formatBytes(image.stats.size)}</div>,
          },
          {
            label: t('im.birth_time'),
            children: <div>{formatDate(image.stats.birthtime)}</div>,
          },
          {
            label: t('im.last_status_changed_time'),
            children: <div>{formatDate(image.stats.ctime)}</div>,
          },
          {
            label: t('im.compressed'),
            children:
              image.fileType === 'svg' ? (
                <div className={'flex items-center gap-x-1'}>
                  <a
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
                  </a>
                  <Tooltip title={t('im.svg_compressed_tip')}>
                    <BsQuestionCircleFill />
                  </Tooltip>
                </div>
              ) : (
                <div>{compressed ? t('im.yes') : t('im.no')}</div>
              ),
          },
        ]

        modal.confirm({
          width: '50%',
          icon: null,
          closable: true,
          title: t('im.image_detail'),
          className: styles.detail_modal,
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

        resolve(true)
      })
    })
  })

  return { showImageDetailModal }
}
