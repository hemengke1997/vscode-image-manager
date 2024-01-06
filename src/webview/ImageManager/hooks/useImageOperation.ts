import { useMemoizedFn } from '@minko-fe/react-hook'
import { CmdToVscode } from '@rootSrc/message/shared'
import { vscodeApi } from '@rootSrc/webview/vscode-api'
import { App } from 'antd'
import { useTranslation } from 'react-i18next'

function useImageOperation() {
  const { message } = App.useApp()
  const { t } = useTranslation()

  const copyImage = useMemoizedFn((imagePath: string) => {
    vscodeApi.postMessage({ cmd: CmdToVscode.COPY_IMAGE, data: { filePath: imagePath } }, (data) => {
      if (!data.failed) {
        message.success(t('ia.copy_success'))
      } else {
        message.error(data.stderr)
      }
    })
  })

  const openInVscodeExplorer = useMemoizedFn((imagePath: string) => {
    vscodeApi.postMessage({ cmd: CmdToVscode.OPEN_IMAGE_IN_VSCODE_EXPLORER, data: { filePath: imagePath } })
  })

  const openInOsExplorer = useMemoizedFn((imagePath: string) => {
    vscodeApi.postMessage({ cmd: CmdToVscode.OPEN_IMAGE_IN_OS_EXPLORER, data: { filePath: imagePath } })
  })

  const copyImageAsBase64 = useMemoizedFn((imagePath: string): Promise<string> => {
    return new Promise((resolve) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.COPY_IMAGE_AS_BASE64, data: { filePath: imagePath } }, (data) => {
        resolve(data)
      })
    })
  })

  const testVscodeBuiltInCmd = useMemoizedFn(({ cmd, path }: { cmd: string; path: string }) => {
    vscodeApi.postMessage({ cmd: CmdToVscode.TEMP_TEST_CMD, data: { cmd, path } })
  })

  return {
    copyImage,
    openInVscodeExplorer,
    openInOsExplorer,
    copyImageAsBase64,
    testVscodeBuiltInCmd,
  }
}

export default useImageOperation
