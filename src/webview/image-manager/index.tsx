import { difference, isEqual } from '@minko-fe/lodash-pro'
import { useDebounceEffect, useMemoizedFn, useUpdateEffect } from '@minko-fe/react-hook'
import { App, FloatButton } from 'antd'
import { setAutoFreeze } from 'immer'
import { memo, useEffect, useMemo, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { GoMoveToTop } from 'react-icons/go'
import { isTooManyTries, retry } from 'ts-retry'
import { type MessageType } from '~/message'
import { CmdToVscode, CmdToWebview } from '~/message/cmd'
import logger from '~/utils/logger'
import useUpdateWebview from '../hooks/use-update-webview'
import { getAppRoot } from '../utils'
import { vscodeApi } from '../vscode-api'
import ContextMenus from './components/context-menus'
import ImageCompressor from './components/image-compressor'
import ImageConverter from './components/image-converter'
import ImageCropper from './components/image-cropper'
import ImageForSize from './components/image-for-size'
import ImageSearch from './components/image-search'
import ImageSimilarity from './components/image-similarity'
import Viewer from './components/viewer'
import ViewerSettings, { type ViewerSettingsRef } from './components/viewer-settings'
import ActionContext from './contexts/action-context'
import CroppoerContext from './contexts/cropper-context'
import GlobalContext, { type WebviewCompressorType, type WebviewFormatConverterType } from './contexts/global-context'
import OperatorContext from './contexts/operator-context'
import SettingsContext from './contexts/settings-context'

vscodeApi.registerEventListener()

setAutoFreeze(false)

function ImageManager() {
  const { message } = App.useApp()
  const { t } = useTranslation()

  const { setImageState, setCompressor, imageState, setFormatConverter, setImageReveal } = GlobalContext.usePicker([
    'setImageState',
    'setCompressor',
    'imageState',
    'setFormatConverter',
    'setImageReveal',
  ])

  const { imageRefreshedState, refreshImages, imageSearchOpen, setImageSearchOpen } = ActionContext.usePicker([
    'imageRefreshedState',
    'refreshImages',
    'imageSearchOpen',
    'setImageSearchOpen',
  ])

  const {
    compressorModal,
    setCompressorModal,
    formatConverterModal,
    setFormatConverterModal,
    similarityModal,
    setSimilarityModal,
  } = OperatorContext.usePicker([
    'compressorModal',
    'setCompressorModal',
    'formatConverterModal',
    'setFormatConverterModal',
    'similarityModal',
    'setSimilarityModal',
  ])

  const { displayImageTypes } = SettingsContext.usePicker(['displayImageTypes'])

  const { refreshTimes, refreshType } = imageRefreshedState

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

  useDebounceEffect(
    () => {
      const isRefresh = refreshTimes && refreshType === 'refresh'
      const messageKey = 'refresh_images'
      let timer: number
      if (isRefresh) {
        timer = window.setTimeout(() => {
          message.loading({
            content: t('im.img_refreshing'),
            key: messageKey,
            duration: 0,
          })
          clearTimeout(timer)
        }, 250)
      }

      vscodeApi.postMessage({ cmd: CmdToVscode.get_all_images }, ({ data, workspaceFolders }) => {
        logger.debug('get_all_images', data, workspaceFolders)

        setImageState({
          data,
          workspaceFolders,
          loading: false,
        })

        if (isRefresh) {
          clearTimeout(timer)
          message.destroy(messageKey)
          message.success(t('im.img_refreshed'))
        }
      })
    },
    [refreshTimes],
    {
      wait: 500,
      leading: true,
    },
  )

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
      const [compressor, formatConverter] = await retry(() => Promise.all([getCompressor(), getFormatConverter()]), {
        delay: 1000,
        maxTry: 10,
        until: (data) => !!data,
      })

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

      {compressorModal.closed ? null : (
        <ImageCompressor
          {...compressorModal}
          onOpenChange={(open) => setCompressorModal({ open })}
          afterClose={() => {
            setCompressorModal({ closed: true, fields: {} })
          }}
        />
      )}
      {formatConverterModal.closed ? null : (
        <ImageConverter
          {...formatConverterModal}
          onOpenChange={(open) => setFormatConverterModal({ open })}
          afterClose={() => {
            setFormatConverterModal({ closed: true })
          }}
        />
      )}
      {similarityModal.closed ? null : (
        <ImageSimilarity
          {...similarityModal}
          onOpenChange={(open) => setSimilarityModal({ open })}
          afterClose={() => {
            setSimilarityModal({ closed: true })
          }}
        />
      )}
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
