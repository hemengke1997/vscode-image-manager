import { useMemoizedFn } from '@minko-fe/react-hook'
import { App, Button } from 'antd'
import { useTranslation } from 'react-i18next'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '~/webview/vscode-api'
import { type ImageType } from '..'
import CroppoerContext from '../contexts/CropperContext'
import GlobalContext from '../contexts/GlobalContext'
import OperatorContext from '../contexts/OperatorContext'

function useImageOperation() {
  const { compressor } = GlobalContext.usePicker(['compressor'])
  const { notification } = App.useApp()
  const { t } = useTranslation()

  const { setOperatorModal } = OperatorContext.usePicker(['setOperatorModal'])

  const openInVscodeExplorer = useMemoizedFn((filePath: string) => {
    vscodeApi.postMessage({ cmd: CmdToVscode.open_image_in_vscode_explorer, data: { filePath } })
  })

  const openInOsExplorer = useMemoizedFn((filePath: string) => {
    vscodeApi.postMessage({ cmd: CmdToVscode.open_image_in_os_explorer, data: { filePath } })
  })

  const copyImageAsBase64 = useMemoizedFn((filePath: string): Promise<string> => {
    return new Promise((resolve) => {
      vscodeApi.postMessage({ cmd: CmdToVscode.copy_image_as_base64, data: { filePath } }, (data) => {
        resolve(data)
      })
    })
  })

  const beginCompressProcess = useMemoizedFn((images: ImageType[]) => {
    if (!compressor) {
      notification.error({
        duration: null,
        message: t('im.deps_not_found'),
        description: (
          <Button type='primary' href={import.meta.env.IM_QA_URL}>
            {t('im.view_solution')}
          </Button>
        ),
      })
      return
    }
    // open compress modal
    setOperatorModal({
      open: true,
      images,
    })
  })

  const { setCropperProps } = CroppoerContext.usePicker(['setCropperProps'])
  const cropImage = useMemoizedFn((image: ImageType) => {
    setCropperProps({ open: true, image })
  })

  return {
    openInVscodeExplorer,
    openInOsExplorer,
    copyImageAsBase64,
    beginCompressProcess,
    cropImage,
  }
}

export default useImageOperation
