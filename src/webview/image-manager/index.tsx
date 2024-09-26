import { memo, useEffect, useMemo } from 'react'
import { flushSync } from 'react-dom'
import { ErrorBoundary } from 'react-error-boundary'
import { useTranslation } from 'react-i18next'
import { useMemoizedFn, useUpdateEffect } from 'ahooks'
import { App, FloatButton } from 'antd'
import { enableMapSet, setAutoFreeze } from 'immer'
import { GoMoveToTop } from 'react-icons/go'
import { isTooManyTries, retryAsync } from 'ts-retry'
import { type MessageType } from '~/message'
import { CmdToVscode, CmdToWebview } from '~/message/cmd'
import logger from '~/utils/logger'
import useUpdateWebview from '../hooks/use-update-webview'
import { getAppRoot } from '../utils'
import { vscodeApi } from '../vscode-api'
import AntdConfigProvider from './components/antd-config-provider'
import ContextMenus from './components/context-menus'
import Fallback from './components/fallback'
import ImageForSize from './components/image-for-size'
import Layout from './components/layout'
import Viewer from './components/viewer'
import ActionContext from './contexts/action-context'
import GlobalContext, { type WebviewCompressorType, type WebviewFormatConverterType } from './contexts/global-context'
import useRefreshImages from './hooks/use-refresh-images'

vscodeApi.registerEventListener()

setAutoFreeze(false)
enableMapSet()

function ImageManager() {
  const { message } = App.useApp()
  const { t } = useTranslation()

  const { setCompressor, imageState, setFormatConverter, setImageReveal, setAllImageTypes } = GlobalContext.usePicker([
    'setCompressor',
    'imageState',
    'setFormatConverter',
    'setImageReveal',
    'setAllImageTypes',
  ])

  const { refreshImages } = ActionContext.usePicker(['refreshImages'])

  // all image types
  const allImageTypes = useMemo(() => imageState.data.flatMap((item) => item.fileTypes), [imageState.data])

  useUpdateEffect(() => {
    setAllImageTypes(allImageTypes)
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

  return (
    <AntdConfigProvider>
      <ErrorBoundary FallbackComponent={Fallback}>
        <ContextMenus />

        <Layout>
          <Viewer />
        </Layout>

        <ImageForSize />

        <FloatButton.BackTop target={getAppRoot} duration={0} icon={<GoMoveToTop />} type='primary' shape='square' />
      </ErrorBoundary>
    </AntdConfigProvider>
  )
}

export default memo(ImageManager)
