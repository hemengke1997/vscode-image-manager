import { useLockFn, useMemoizedFn } from '@minko-fe/react-hook'
import { App, Descriptions, type DescriptionsProps } from 'antd'
import { memo } from 'react'
import { type BooleanPredicate, Item, type ItemParams, Separator } from 'react-contexify'
import { useTranslation } from 'react-i18next'
import { os } from 'un-detector'
import { type ImageType } from '@/webview/ImageManager'
import useImageOperation from '@/webview/ImageManager/hooks/useImageOperation'
import { formatBytes } from '@/webview/ImageManager/utils'
import MaskMenu from '../../../MaskMenu'
import useOperation from '../../hooks/useOperation'
import styles from './index.module.css'

export const IMAGE_CONTEXT_MENU_ID = 'IMAGE_CONTEXT_MENU_ID'

function ImageContextMenu() {
  const { t } = useTranslation()
  const { message, modal } = App.useApp()

  const {
    openInOsExplorer,
    openInVscodeExplorer,
    copyImageAsBase64,
    beginCompressProcess,
    cropImage,
    _testVscodeBuiltInCmd,
  } = useImageOperation()

  const handleCopyString = useLockFn(
    async (
      e: ItemParams<{ image: ImageType }>,
      type: 'name' | 'path',
      callback?: (s: string) => Promise<string | undefined>,
    ) => {
      const s = e.props?.image[type] || ''
      if (!s) {
        message.error(t('im.copy_fail'))
        return
      }
      const res = await callback?.(s)
      navigator.clipboard.writeText(res || s)
      message.success(t('im.copy_success'))
    },
  )

  const handleOpenInOsExplorer = (e: ItemParams<{ image: ImageType }>) => {
    openInOsExplorer(e.props!.image.path)
  }

  const handleOpenInVscodeExplorer = (e: ItemParams<{ image: ImageType }>) => {
    openInVscodeExplorer(e.props!.image.path)
  }

  const { isCompressDisabled } = useOperation()

  const _isOperationHidden = useMemoizedFn((e: ItemParams<{ operable: boolean }>) => {
    const { operable = true } = e.props || {}
    return !operable
  })
  const isOperationHidden = _isOperationHidden as BooleanPredicate

  const handleCompressImage = useMemoizedFn((e: ItemParams<{ image: ImageType }>) => {
    beginCompressProcess([e.props!.image])
  })

  const handleShowImageDetail = useLockFn(
    (e: ItemParams<{ image: ImageType; dimensions: { width: number; height: number } }>) => {
      const { image, dimensions } = e.props || {}

      if (!image) return Promise.resolve()

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
          label: t('im.folder'),
          children: <div>{image.dirPath || '/'}</div>,
        },
        {
          label: `${t('im.dimensions')}(px)`,
          children: (
            <div>
              {dimensions?.width} x {dimensions?.height}
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
      ]

      modal.success({
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

      return Promise.resolve()
    },
  )

  const handleCropImage = useLockFn(async (e: ItemParams<{ image: ImageType }>) => {
    if (!e.props?.image) {
      return message.error(t('im.no_image'))
    }
    cropImage(e.props.image)
  })

  const _test = (e: ItemParams<{ image: ImageType }>) => {
    _testVscodeBuiltInCmd({
      cmd: 'revealFileInOS',
      path: e.props?.image.path || '',
    })
  }

  return (
    <>
      <MaskMenu id={IMAGE_CONTEXT_MENU_ID}>
        <Item onClick={(e) => handleCopyString(e, 'name')}>{t('im.copy_image_name')}</Item>
        <Item onClick={(e) => handleCopyString(e, 'path')}>{t('im.copy_image_path')}</Item>
        <Item onClick={(e) => handleCopyString(e, 'path', copyImageAsBase64)}>{t('im.copy_image_base64')}</Item>
        <Separator hidden={isOperationHidden} />
        <Item
          // disabled={isCompressDisabled}
          hidden={isOperationHidden}
          onClick={handleCompressImage}
        >
          {t('im.compress')}
        </Item>
        <Item onClick={(e) => handleCropImage(e)} hidden={isOperationHidden}>
          {t('im.crop')}
        </Item>

        <Separator />
        <Item onClick={handleOpenInOsExplorer}>
          {os.isMac() ? t('im.reveal_in_os_mac') : t('im.reveal_in_os_windows')}
        </Item>
        <Item onClick={handleOpenInVscodeExplorer}>{t('im.reveal_in_explorer')}</Item>
        <Separator />
        <Item onClick={(e) => handleShowImageDetail(e)}>{t('im.detail')}</Item>
      </MaskMenu>
    </>
  )
}

export default memo(ImageContextMenu)
