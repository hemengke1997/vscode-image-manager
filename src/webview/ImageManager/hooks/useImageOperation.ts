import { useMemoizedFn } from '@minko-fe/react-hook'
import { CmdToVscode } from '@root/message/shared'
import { vscodeApi } from '@root/webview/vscode-api'
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

  const pasteImage = useMemoizedFn((dest: string) => {
    vscodeApi.postMessage({ cmd: CmdToVscode.PASTE_IMAGE, data: { dest } }, (data) => {
      if (!data.failed) {
        message.success('Paste success')
      } else {
        message.error(data.stderr)
      }
    })
  })

  return {
    copyImage,
    pasteImage,
  }
}

export default useImageOperation
