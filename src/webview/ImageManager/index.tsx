import { difference, isEqual } from '@minko-fe/lodash-pro'
import { useAsyncEffect, useMemoizedFn } from '@minko-fe/react-hook'
import { isDev } from '@minko-fe/vite-config/client'
import { App, FloatButton } from 'antd'
import { type Stats } from 'fs-extra'
import { type ParsedPath } from 'node:path'
import { type ReactElement, memo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { isTooManyTries, retry } from 'ts-retry'
import { type Compressor } from '~/core/compress'
import { type MessageType } from '~/message'
import { CmdToVscode, CmdToWebview } from '~/message/cmd'
import useUpdateConfig from '../hooks/useUpdateConfig'
import { vscodeApi } from '../vscode-api'
import ContextMenus from './components/ContextMenus'
import ImageCropper from './components/ImageCropper'
import ImageForSize from './components/ImageForSize'
import ImageOperator from './components/ImageOperator'
import ImageSearch from './components/ImageSearch'
import Viewer from './components/Viewer'
import ViewerSettings, { type ViewerSettingsRef } from './components/ViewerSettings'
import ActionContext from './contexts/ActionContext'
import CroppoerContext from './contexts/CropperContext'
import GlobalContext from './contexts/GlobalContext'
import OperatorContext from './contexts/OperatorContext'
import SettingsContext from './contexts/SettingsContext'

vscodeApi.registerEventListener()

// The visible of image is determined by 'visible' prop.
// at present, there are following filetr condition
// 1. type - image type (i.e png, jpg, gif)
// 2. size - image size (i.e 1kb)
// 3. git-staged - whether the image is git staged
// 4. compressed - whether the image is compressed
export type ImageVisibleFilterType = 'file_type' | 'size' | 'git_staged' | 'compressed'

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

  const { setImageState, setCompressor } = GlobalContext.usePicker(['setImageState', 'setCompressor'])

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
    const messageKey = 'refresh_images'
    if (isRefresh) {
      message.loading({
        content: t('im.img_refreshing'),
        key: messageKey,
        duration: 0,
      })
    }

    vscodeApi.postMessage({ cmd: CmdToVscode.get_all_images }, ({ data, workspaceFolders }) => {
      if (isDev()) {
        console.log('get_all_images', data, workspaceFolders)
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
      vscodeApi.postMessage({ cmd: CmdToVscode.get_compressor }, (data) => {
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

  const { updateConfig } = useUpdateConfig()

  const clearLocalStorages = () => {
    window.localStorage.clear()
  }

  useEffect(() => {
    clearLocalStorages()

    function onMessage(e: MessageEvent) {
      const { cmd } = e.data as MessageType<Record<string, any>, keyof typeof CmdToWebview>
      switch (cmd) {
        case CmdToWebview.refresh_images: {
          refreshImages({ type: 'slient-refresh' })
          break
        }
        case CmdToWebview.program_reload_webview: {
          window.mountApp(true)
          break
        }
        case CmdToWebview.update_config: {
          updateConfig()
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

  /* --------------- image cropper -------------- */
  const { cropperProps, setCropperProps } = CroppoerContext.usePicker(['cropperProps', 'setCropperProps'])

  return (
    <>
      <ContextMenus />

      <ViewerSettings ref={viewerSettingsRef} />
      <Viewer />

      <ImageForSize />
      <ImageSearch open={imageSearchOpen} onOpenChange={setImageSearchOpen} />
      <ImageCropper {...cropperProps} onOpenChange={(open) => setCropperProps({ open })} />
      <ImageOperator {...operatorModal} onOpenChange={(open) => setOperatorModal({ open })} />
      <FloatButton.BackTop target={() => document.querySelector('#root') as HTMLElement} />
    </>
  )
}

export default memo(ImageManager)
