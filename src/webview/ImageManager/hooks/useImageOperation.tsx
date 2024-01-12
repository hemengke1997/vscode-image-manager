import { ceil, isObject } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { CmdToVscode } from '@rootSrc/message/shared'
import { vscodeApi } from '@rootSrc/webview/vscode-api'
import { App, Button } from 'antd'
import { useTranslation } from 'react-i18next'
import { IoMdTrendingDown } from 'react-icons/io'
import { formatBytes, getFilenameFromPath } from '../utils'

function useImageOperation() {
  const { notification } = App.useApp()
  const { t } = useTranslation()

  const openInVscodeExplorer = useMemoizedFn((filePath: string) => {
    vscodeApi.postMessage({ cmd: CmdToVscode.OPEN_IMAGE_IN_VSCODE_EXPLORER, data: { filePath } })
  })

  const openInOsExplorer = useMemoizedFn((filePath: string) => {
    vscodeApi.postMessage({ cmd: CmdToVscode.OPEN_IMAGE_IN_OS_EXPLORER, data: { filePath } })
  })

  const copyImageAsBase64 = useMemoizedFn((filePath: string): Promise<string> => {
    return new Promise((resolve) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.COPY_IMAGE_AS_BASE64, data: { filePath } }, (data) => {
        resolve(data)
      })
    })
  })

  const compressImage = useMemoizedFn(
    (
      filePaths: string[],
    ): Promise<
      | {
          filePath: string
          originSize?: number | undefined
          compressedSize?: number | undefined
          error?: any
        }[]
      | undefined
    > => {
      return new Promise((resolve) => {
        vscodeApi.postMessage({ cmd: CmdToVscode.COMPRESS_IMAGE, data: { filePaths } }, (data) => {
          resolve(data)
        })
      })
    },
  )

  const onCompressEnd = useMemoizedFn(
    (
      result: {
        filePath: string
        originSize?: number | undefined
        compressedSize?: number | undefined
        error?: any
      },
      options: {
        onError?: (filePath: string, error: string) => void
        onRetryClick?: (filePath: string) => void
      },
    ) => {
      const { originSize, compressedSize, filePath, error } = result
      const filename = getFilenameFromPath(filePath)
      if (originSize && compressedSize) {
        const percent = ceil(((originSize - compressedSize) / originSize) * 100)
        notification.success({
          duration: 10,
          message: filename,
          description: (
            <div className={'flex items-center space-x-2'}>
              <div className={'text-ant-color-error font-bold'}>-{percent}%</div>
              <div className={'flex-center text-ant-color-text-secondary'}>
                <span>({formatBytes(originSize)}</span>
                <div className={'flex-center'}>
                  <IoMdTrendingDown />
                </div>
                <span>{formatBytes(compressedSize)})</span>
              </div>
            </div>
          ),
        })
      } else {
        const { onError, onRetryClick } = options
        const _error = isObject(error) ? JSON.stringify(error) : error

        onError?.(filePath, _error || '')
        const notificationKey = `${filename}-compress-fail`
        notification.error({
          duration: null,
          key: notificationKey,
          message: filename,
          description: (
            <div className={'flex flex-col space-y-2'}>
              <div>
                {t('ia.compress_fail')}: {_error}
              </div>
              <div>
                <Button
                  onClick={() => {
                    notification.destroy(notificationKey)
                    onRetryClick?.(filePath)
                  }}
                >
                  {t('ia.retry')}
                </Button>
              </div>
            </div>
          ),
        })
      }
    },
  )

  const _testVscodeBuiltInCmd = useMemoizedFn(({ cmd, path }: { cmd: string; path: string }) => {
    vscodeApi.postMessage({ cmd: CmdToVscode.TEMP_TEST_CMD, data: { cmd, path } })
  })

  return {
    openInVscodeExplorer,
    openInOsExplorer,
    copyImageAsBase64,
    compressImage,
    onCompressEnd,
    _testVscodeBuiltInCmd,
  }
}

export default useImageOperation
