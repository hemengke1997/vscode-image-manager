import { useMemoizedFn } from '@minko-fe/react-hook'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '~/webview/vscode-api'
import { type ImageType } from '..'
import CroppoerContext from '../contexts/CropperContext'
import OperatorContext from '../contexts/OperatorContext'

function useImageOperation() {
  const { setOperatorModal } = OperatorContext.usePicker(['setOperatorModal'])

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

  const beginCompressProcess = useMemoizedFn((images: ImageType[]) => {
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
