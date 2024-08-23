import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { App, FloatButton } from 'antd'
import { setAutoFreeze } from 'immer'
import { difference, isEqual } from 'lodash-es'
import { memo, useEffect, useMemo, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { GoMoveToTop } from 'react-icons/go'
import { isTooManyTries, retryAsync } from 'ts-retry'
import { type MessageType } from '~/message'
import { CmdToVscode, CmdToWebview } from '~/message/cmd'
import logger from '~/utils/logger'
import useUpdateWebview from '../hooks/use-update-webview'
import { getAppRoot } from '../utils'
import { vscodeApi } from '../vscode-api'
import ContextMenus from './components/context-menus'
import ImageForSize from './components/image-for-size'
import Viewer from './components/viewer'
import ViewerSettings, { type ViewerSettingsRef } from './components/viewer-settings'
import ActionContext from './contexts/action-context'
import GlobalContext, { type WebviewCompressorType, type WebviewFormatConverterType } from './contexts/global-context'
import SettingsContext from './contexts/settings-context'
import useRefreshImages from './hooks/use-refresh-images'

vscodeApi.registerEventListener()

setAutoFreeze(false)

function ImageManager() {
  const { message } = App.useApp()
  const { t } = useTranslation()

  const { setCompressor, imageState, setFormatConverter, setImageReveal } = GlobalContext.usePicker([
    'setCompressor',
    'imageState',
    'setFormatConverter',
    'setImageReveal',
  ])

  const { refreshImages } = ActionContext.usePicker(['refreshImages'])

  const { displayImageTypes } = SettingsContext.usePicker(['displayImageTypes'])

  /**
   * setup image display types
   * @param reset whether reset image display types
   */
  const setupImageDisplayTypes = useMemoizedFn((reset = false) => {
    const _reset = () => {
      viewerSettingsRef.current?.changeImageType(allImageTypes)
    }
    if (reset) {
      _reset()
      return
    }
    try {
      const shouldCheckedTypes = displayImageTypes?.unchecked.length
        ? difference(allImageTypes, displayImageTypes.unchecked)
        : allImageTypes

      // avoid unnecessary render
      if (!isEqual(shouldCheckedTypes, displayImageTypes?.checked)) {
        viewerSettingsRef.current?.changeImageType(shouldCheckedTypes)
      }
    } catch {
      _reset()
    }
  })

  // all image types
  const allImageTypes = useMemo(() => imageState.data.flatMap((item) => item.fileTypes), [imageState.data])

  useUpdateEffect(() => {
    setupImageDisplayTypes()
  }, [allImageTypes])

  useRefreshImages()

  const getCompressor = useMemoizedFn(() => {
    return new Promise<WebviewCompressorType>((resolve, reject) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.get_compressor }, (data) => {
        if (!data) {
          reject()
        } else {
          resolve(data)
        }
      })
    })
  })

  const getFormatConverter = useMemoizedFn(() => {
    return new Promise<WebviewFormatConverterType>((resolve, reject) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.get_format_converter }, (data) => {
        if (!data) {
          reject()
        } else {
          resolve(data)
        }
      })
    })
  })

  const getOperator = useMemoizedFn(async () => {
    try {
      const [compressor, formatConverter] = await retryAsync(
        () => Promise.all([getCompressor(), getFormatConverter()]),
        {
          delay: 1000,
          maxTry: 10,
          until: (data) => !!data.length,
        },
      )

      setCompressor(compressor)
      setFormatConverter(formatConverter)
    } catch (err) {
      if (isTooManyTries(err)) {
        message.error(t('im.deps_not_found'))
      }
    }
  })

  useEffect(() => {
    getOperator()
  }, [])

  const { updateConfig, updateWorkspaceState } = useUpdateWebview()

  const clearLocalStorages = useMemoizedFn(() => {
    // For old extension version.
    window.localStorage.clear()
  })

  const onMessage = useMemoizedFn((e: MessageEvent) => {
    const { cmd, data } = e.data as MessageType<Record<string, any>, keyof typeof CmdToWebview>

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
        getOperator()
        break
      }
      case CmdToWebview.update_workspaceState: {
        updateWorkspaceState(allImageTypes)
        break
      }
      case CmdToWebview.reveal_image_in_viewer: {
        if (data.imagePath) {
          logger.debug('reveal_image_in_viewer', data.imagePath)
        } else {
          logger.debug('reveal_image_in_viewer', '清除')
        }
        const { imagePath } = data
        window.__reveal_image_path__ = imagePath
        flushSync(() => {
          setImageReveal(imagePath)
        })
        break
      }
      default:
        break
    }
  })

  useEffect(() => {
    clearLocalStorages()

    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [onMessage])

  /* -------------- viewer settings ------------- */
  const viewerSettingsRef = useRef<ViewerSettingsRef>(null)

  return (
    <>
      <ContextMenus />

      <ViewerSettings ref={viewerSettingsRef} />
      <Viewer />

      <ImageForSize />

      <FloatButton.BackTop
        target={() => getAppRoot()}
        duration={0}
        icon={<GoMoveToTop />}
        type='primary'
        shape='square'
      />
    </>
  )
}

export default memo(ImageManager)
