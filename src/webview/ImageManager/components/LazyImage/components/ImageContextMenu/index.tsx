import { useLockFn } from '@minko-fe/react-hook'
import { type ImageType } from '@rootSrc/webview/ImageManager'
import GlobalContext from '@rootSrc/webview/ImageManager/contexts/GlobalContext'
import useImageOperation from '@rootSrc/webview/ImageManager/hooks/useImageOperation'
import { formatBytes } from '@rootSrc/webview/ImageManager/utils'
import FrameworkContext from '@rootSrc/webview/ui-framework/src/contexts/FrameworkContext'
import { App, Descriptions, type DescriptionsProps } from 'antd'
import { memo } from 'react'
import { type BooleanPredicate, Item, type ItemParams, Menu, Separator } from 'react-contexify'
import { useTranslation } from 'react-i18next'
import { os } from 'un-detector'
import styles from './index.module.css'

export const IMAGE_CONTEXT_MENU_ID = 'IMAGE_CONTEXT_MENU_ID'

function ImageContextMenu() {
  const { t } = useTranslation()
  const { theme } = FrameworkContext.usePicker(['theme'])
  const { message, modal } = App.useApp()

  const {
    openInOsExplorer,
    openInVscodeExplorer,
    copyImageAsBase64,
    compressImage,
    onCompressEnd,
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

  const { compressor } = GlobalContext.usePicker(['compressor'])
  const isCompressDisabled = (e: ItemParams<{ image: ImageType }>) => {
    const supportedExts = compressor?.config.exts
    if (supportedExts?.includes(e.props?.image.extraPathInfo.ext || '')) {
      return false
    }
    return true
  }

  const handleCompressImage = useLockFn(async (filePath: string) => {
    const LoadingKey = `${filePath}-compressing`
    message.loading({
      content: t('im.compressing'),
      duration: 0,
      key: LoadingKey,
    })
    const res = await compressImage([filePath])
    message.destroy(LoadingKey)

    if (Array.isArray(res)) {
      res.forEach((item) => {
        onCompressEnd(item, {
          onRetryClick: (filePath) => {
            handleCompressImage(filePath)
          },
        })
      })
    }
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
          key: '1',
          label: t('im.name'),
          children: <div>{image.name}</div>,
        },
        {
          key: '2',
          label: t('im.workspace'),
          children: <div>{image.workspaceFolder}</div>,
        },
        {
          key: '3',
          label: t('im.folder'),
          children: <div>{image.dirPath}</div>,
        },
        {
          key: '4',
          label: t('im.dimensions'),
          children: (
            <div>
              {dimensions?.width} x {dimensions?.height}
            </div>
          ),
        },
        {
          key: '5',
          label: t('im.size'),
          children: <div>{formatBytes(image.stats.size)}</div>,
        },
        {
          key: '6',
          label: t('im.birth_time'),
          children: <div>{formatDate(image.stats.birthtime)}</div>,
        },
        {
          key: '7',
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
            items={descItems}
          />
        ),
        footer: null,
      })

      return Promise.resolve()
    },
  )

  const _test = (e: ItemParams<{ image: ImageType }>) => {
    _testVscodeBuiltInCmd({
      cmd: 'revealFileInOS',
      path: e.props?.image.path || '',
    })
  }

  return (
    <>
      <Menu id={IMAGE_CONTEXT_MENU_ID} theme={theme}>
        <Item onClick={(e) => handleCopyString(e, 'name')}>{t('im.copy_image_name')}</Item>
        <Item onClick={(e) => handleCopyString(e, 'path')}>{t('im.copy_image_path')}</Item>
        <Item onClick={(e) => handleCopyString(e, 'path', copyImageAsBase64)}>{t('im.copy_image_base64')}</Item>
        <Separator />
        <Item
          disabled={isCompressDisabled as BooleanPredicate}
          onClick={(e: ItemParams<{ image: ImageType }>) => handleCompressImage(e.props!.image.path)}
        >
          {t('im.compress')}
        </Item>
        <Separator />
        <Item onClick={handleOpenInOsExplorer}>
          {os.isMac() ? t('im.reveal_in_os_mac') : t('im.reveal_in_os_windows')}
        </Item>
        <Item onClick={handleOpenInVscodeExplorer}>{t('im.reveal_in_explorer')}</Item>
        <Separator />
        <Item onClick={(e) => handleShowImageDetail(e)}>{t('im.detail')}</Item>
      </Menu>
    </>
  )
}

export default memo(ImageContextMenu)
