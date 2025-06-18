import type { WebviewCompressorType, WebviewFormatConverterType } from './stores/global/global-store'
import type { CmdToWebviewMessage } from '~/message/webview-message-factory'
import { useEventListener, useMemoizedFn } from 'ahooks'
import { App, Button, FloatButton } from 'antd'
import { enableMapSet, setAutoFreeze } from 'immer'
import { useAtomValue, useSetAtom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { memo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GoMoveToTop } from 'react-icons/go'
import { CmdToVscode, CmdToWebview } from '~/message/cmd'
import logger from '~/utils/logger'
import { getAppRoot } from '../utils'
import { vscodeApi } from '../vscode-api'
import ContextMenus from './components/context-menus'
import ImageForSize from './components/image-for-size'
import Layout from './components/layout'
import { ToasterWithMax } from './components/toaster-with-max'
import Viewer from './components/viewer'
import useFetchExtension from './hooks/use-fetch-extension'
import useImageOperation from './hooks/use-image-operation'
import useUpdateImages from './hooks/use-update-images'
import useUpdateWebview from './hooks/use-update-webview'
import { GlobalAtoms } from './stores/global/global-store'
import { VscodeAtoms } from './stores/vscode/vscode-store'
import { UpdateType } from './utils/tree/const'

vscodeApi.registerEventListener()

setAutoFreeze(false)
enableMapSet()

function ImageManager() {
  const { notification } = App.useApp()
  const { t } = useTranslation()

  const installDependencies = useAtomValue(
    selectAtom(
      VscodeAtoms.extConfigAtom,
      useMemoizedFn(state => state.core.installDependencies),
    ),
  )

  const setCompressor = useSetAtom(GlobalAtoms.compressorAtom)
  const setFormatConverter = useSetAtom(GlobalAtoms.formatConverterAtom)
  const sharpInstalled = useAtomValue(GlobalAtoms.sharpInstalledAtom)

  useFetchExtension()

  useEffect(() => {
    if (installDependencies && !sharpInstalled) {
      const key = 'deps_not_found'
      notification.warning({
        message: t('im.deps_not_found'),
        key,
        description: (
          <div className='flex flex-col gap-y-2'>
            <div>{t('im.no_sharp')}</div>
            <div className='flex w-full justify-end'>
              <Button
                type='primary'
                href={import.meta.env.IM_QA_URL}
                onClick={() => {
                  notification.destroy(key)
                }}
              >
                {t('im.view_solution')}
              </Button>
            </div>
          </div>
        ),
        duration: 0,
      })
    }
  }, [sharpInstalled])

  const getCompressor = useMemoizedFn(() => {
    return new Promise<WebviewCompressorType>((resolve, reject) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.get_compressor }, (data) => {
        if (!data) {
          reject(new Error('Compressor not found'))
        }
        else {
          resolve(data)
        }
      })
    })
  })

  const getFormatConverter = useMemoizedFn(() => {
    return new Promise<WebviewFormatConverterType>((resolve, reject) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.get_format_converter }, (data) => {
        if (!data) {
          reject(new Error('Format converter not found'))
        }
        else {
          resolve(data)
        }
      })
    })
  })

  const getOperator = useMemoizedFn(async () => {
    try {
      const [compressor, formatConverter] = await Promise.all([getCompressor(), getFormatConverter()])

      setCompressor(compressor)
      setFormatConverter(formatConverter)
    }
    catch (err) {
      logger.error(t('im.deps_not_found'), err)
    }
  })

  const { getAllImages, patchUpdate, fullUpdate } = useUpdateImages()

  useEffect(() => {
    getOperator()
    getAllImages()
  }, [])

  const { updateConfig, updateWorkspaceState } = useUpdateWebview()

  const { beginRevealInViewer } = useImageOperation()

  const onMessage = useMemoizedFn((e: MessageEvent) => {
    type CmdToWebviewData<K extends keyof CmdToWebviewMessage> = CmdToWebviewMessage[K]

    let { cmd, data } = e.data as {
      cmd: keyof CmdToWebviewMessage
      data: CmdToWebviewMessage[typeof cmd]
    }

    switch (cmd) {
      case CmdToWebview.update_images: {
        data = data as CmdToWebviewData<CmdToWebview.update_images>
        logger.debug('更新图片', data)

        switch (data.updateType) {
          case UpdateType.full:
            fullUpdate(data)
            break
          case UpdateType.patch:
            patchUpdate(data)
            break
          default:
            break
        }
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
        updateWorkspaceState()
        break
      }
      case CmdToWebview.reveal_image_in_viewer: {
        data = data as CmdToWebviewData<CmdToWebview.reveal_image_in_viewer>
        logger.debug(CmdToWebview.reveal_image_in_viewer, data.imagePath)
        beginRevealInViewer(data.imagePath)
        break
      }
      default:
        break
    }
  })

  useEventListener('message', onMessage)

  return (
    <>
      <ContextMenus />

      <Layout>
        <Viewer />
      </Layout>

      <ImageForSize />

      <FloatButton.BackTop
        target={getAppRoot}
        duration={0}
        icon={<GoMoveToTop />}
        type='primary'
        shape='square'
        visibilityHeight={1000}
      />

      <ToasterWithMax />
    </>
  )
}

export default memo(ImageManager)
