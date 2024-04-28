import { difference, isEqual } from '@minko-fe/lodash-pro'
import { useAsyncEffect, useMemoizedFn, useUpdateEffect } from '@minko-fe/react-hook'
import { App, FloatButton } from 'antd'
import { setAutoFreeze } from 'immer'
import { memo, useEffect, useMemo, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { BiSolidToTop } from 'react-icons/bi'
import { isTooManyTries, retry } from 'ts-retry'
import { type Compressor, type FormatConverter } from '~/core/operator'
import { type MessageType } from '~/message'
import { CmdToVscode, CmdToWebview } from '~/message/cmd'
import logger from '~/utils/logger'
import useUpdateWebview from '../hooks/useUpdateWebview'
import { getAppRoot } from '../utils'
import { vscodeApi } from '../vscode-api'
import ContextMenus from './components/ContextMenus'
import ImageCompressor from './components/ImageCompressor'
import ImageConverter from './components/ImageConverter'
import ImageCropper from './components/ImageCropper'
import ImageForSize from './components/ImageForSize'
import ImageSearch from './components/ImageSearch'
import ImageSimilarity from './components/ImageSimilarity'
import Viewer from './components/Viewer'
import ViewerSettings, { type ViewerSettingsRef } from './components/ViewerSettings'
import ActionContext from './contexts/ActionContext'
import CroppoerContext from './contexts/CropperContext'
import GlobalContext from './contexts/GlobalContext'
import OperatorContext from './contexts/OperatorContext'
import SettingsContext from './contexts/SettingsContext'

vscodeApi.registerEventListener()

setAutoFreeze(false)

function ImageManager() {
  const { message } = App.useApp()
  const { t } = useTranslation()

  const { setImageState, setCompressor, imageState, setFormatConverter, setTargetImagePath } = GlobalContext.usePicker([
    'setImageState',
    'setCompressor',
    'imageState',
    'setFormatConverter',
    'setTargetImagePath',
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
      logger.debug('get_all_images', data, workspaceFolders)

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

  const getFormatConverter = useMemoizedFn(() => {
    return new Promise<FormatConverter>((resolve, reject) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.get_format_converter }, (data) => {
        if (!data) {
          reject()
        } else {
          resolve(data)
        }
      })
    })
  })

  const getOperator = useMemoizedFn(() => {
    return Promise.all([getCompressor(), getFormatConverter()])
  })

  useAsyncEffect(async () => {
    try {
      const [compressor, formatConverter] = await retry(getOperator, {
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
        break
      }
      case CmdToWebview.update_workspaceState: {
        updateWorkspaceState(allImageTypes)
        break
      }
      case CmdToWebview.update_target_image_path: {
        logger.debug('update_target_image_path', data.path)
        window.__target_image_path__ = data.path
        flushSync(() => {
          setTargetImagePath(data.path)
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
      <FloatButton.BackTop target={() => getAppRoot()} duration={0} icon={<BiSolidToTop />} type='primary' />
    </>
  )
}

export default memo(ImageManager)
