import { difference, isEqual } from '@minko-fe/lodash-pro'
import { useAsyncEffect, useMemoizedFn } from '@minko-fe/react-hook'
import { isDev } from '@minko-fe/vite-config/client'
import { App, Card, Skeleton } from 'antd'
import { motion } from 'framer-motion'
import { type Stats } from 'fs-extra'
import { type ParsedPath } from 'node:path'
import { type ReactElement, memo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { isTooManyTries, retry } from 'ts-retry'
import { type Compressor } from '~/core/compress'
import { CmdToVscode, CmdToWebview } from '~/message/cmd'
import { vscodeApi } from '../vscode-api'
import CollapseTree from './components/CollapseTree'
import ContextMenus from './components/ContextMenus'
import ImageActions from './components/ImageActions'
import ImageCropper from './components/ImageCropper'
import ImageForSize from './components/ImageForSize'
import ImageOperator from './components/ImageOperator'
import ImageSearch from './components/ImageSearch'
import ViewerSettings, { type ViewerSettingsRef } from './components/ViewerSettings'
import ActionContext from './contexts/ActionContext'
import CroppoerContext from './contexts/CropperContext'
import GlobalContext from './contexts/GlobalContext'
import OperatorContext from './contexts/OperatorContext'
import SettingsContext from './contexts/SettingsContext'
import TreeContext from './contexts/TreeContext'
import { useExtConfig } from './hooks/useExtConfig'
import useWheelScaleEvent from './hooks/useWheelScaleEvent'

vscodeApi.registerEventListener()

// The visible of image is determined by 'visible' prop.
// at present, there are following filetr condition
// 1. type - image type (i.e png, jpg, gif)
// 2. size - image size (i.e 1kb)
// 3. git-staged - whether the image is git staged
// 4. compressed - whether the image is compressed
export type ImageVisibleFilterType = 'type' | 'size' | 'git_staged' | 'compressed'

export type ImageType = {
  name: string
  path: string
  stats: Stats
  dirPath: string
  fileType: string
  vscodePath: string
  workspaceFolder: string
  absWorkspaceFolder: string
  absDirPath: string
  basePath: string
  extraPathInfo: ParsedPath
} & {
  // extra

  // image visible
  visible?: Partial<Record<ImageVisibleFilterType | string, boolean>>
  // image name for display
  nameElement?: ReactElement
}

function ImageManager() {
  const { message } = App.useApp()
  const { t } = useTranslation()

  const { imageState, setImageState, setCompressor } = GlobalContext.usePicker([
    'imageState',
    'setImageState',
    'setCompressor',
  ])

  const { imageRefreshedState, refreshImages, imageSearchOpen, setImageSearchOpen } = ActionContext.usePicker([
    'imageRefreshedState',
    'refreshImages',
    'imageSearchOpen',
    'setImageSearchOpen',
  ])

  const { operatorModal, setOperatorModal } = OperatorContext.usePicker(['operatorModal', 'setOperatorModal'])

  const { displayImageTypes, setDisplayImageTypes } = SettingsContext.useSelector((ctx) => ctx)

  const { refreshTimes, refreshType } = imageRefreshedState

  useEffect(() => {
    const isRefresh = refreshTimes && refreshType === 'refresh'
    const messageKey = 'REFRESH_IMAGES'
    if (isRefresh) {
      message.loading({
        content: t('im.img_refreshing'),
        key: messageKey,
        duration: 0,
      })
    }

    vscodeApi.postMessage({ cmd: CmdToVscode.GET_ALL_IMAGES }, ({ data, workspaceFolders }) => {
      if (isDev()) {
        console.log('GET_ALL_IMAGES', data, workspaceFolders)
      }

      const allTypes = data.flatMap((item) => item.fileTypes)

      try {
        const imageTypes = displayImageTypes?.unchecked.length
          ? difference(allTypes, displayImageTypes.unchecked)
          : allTypes

        // avoid images flash
        if (!isEqual(imageTypes, displayImageTypes?.checked)) {
          viewerSettingsRef.current?.changeImageType(imageTypes)
        }
      } catch {
        setDisplayImageTypes({ checked: allTypes, unchecked: [] })
      }

      setImageState({
        data,
        workspaceFolders,
        loading: false,
      })

      if (isRefresh) {
        message.destroy(messageKey)
        message.success(t('im.img_refreshed'))
      }
    })
  }, [refreshTimes])

  const getCompressor = useMemoizedFn(() => {
    return new Promise<Compressor>((resolve, reject) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.GET_COMPRESSOR }, (data) => {
        if (!data) {
          reject()
        } else {
          resolve(data)
        }
      })
    })
  })

  useAsyncEffect(async () => {
    try {
      const c = await retry(getCompressor, {
        delay: 1000,
        maxTry: 10,
        until: (data) => !!data,
      })
      setCompressor(c)
    } catch (err) {
      if (isTooManyTries(err)) {
        message.error(t('im.init_compressor_fail'))
      }
    }
  }, [])

  const { updateExtConfig } = useExtConfig()
  useEffect(() => {
    updateExtConfig()
  }, [])

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const message = e.data
      switch (message.cmd) {
        case CmdToWebview.REFRESH_IMAGES: {
          refreshImages({ type: 'slientRefresh' })
          break
        }
        case CmdToWebview.COMPRESSOR_CHANGED: {
          setCompressor(message.data)
          break
        }
        case CmdToWebview.PROGRAM_RELOAD_WEBVIEW: {
          window.mountApp(true)
          break
        }
        case CmdToWebview.UPDATE_CONFIG: {
          updateExtConfig()
          break
        }
        default:
          break
      }
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [])

  /* -------------- viewer settings ------------- */
  const viewerSettingsRef = useRef<ViewerSettingsRef>(null)

  /* ---------------- image scale --------------- */
  const [containerRef] = useWheelScaleEvent()

  /* --------------- image cropper -------------- */
  const { cropperProps, setCropperProps } = CroppoerContext.usePicker(['cropperProps', 'setCropperProps'])

  return (
    <>
      <ContextMenus />

      <ViewerSettings ref={viewerSettingsRef} />

      <div ref={containerRef} className={'space-y-4'}>
        <Card
          styles={{
            header: { borderBottom: 'none' },
            body: { padding: 0 },
          }}
          title={t('im.images')}
          extra={<ImageActions />}
        >
          {imageState.loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1, delay: 0.2 }}>
              <Skeleton className={'p-4'} active paragraph={{ rows: 14 }} />
            </motion.div>
          ) : (
            <div className={'space-y-4'}>
              {imageState.data.map((item, index) => (
                <TreeContext.Provider
                  key={index}
                  value={{
                    imageList: item.imgs,
                  }}
                >
                  <CollapseTree />
                </TreeContext.Provider>
              ))}
            </div>
          )}
        </Card>

        <ImageForSize />
        <ImageSearch open={imageSearchOpen} onOpenChange={setImageSearchOpen} />
      </div>
      <ImageCropper
        {...cropperProps}
        onOpenChange={(open) =>
          setCropperProps((t) => ({
            ...t,
            open,
          }))
        }
      />
      <ImageOperator {...operatorModal} onOpenChange={(open) => setOperatorModal({ open })} />
    </>
  )
}

export default memo(ImageManager)
