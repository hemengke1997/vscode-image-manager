import { useMemoizedFn } from '@minko-fe/react-hook'
import { type BooleanPredicate, type ItemParams } from 'react-contexify'
import { type ImageType } from '@/webview/ImageManager'
import GlobalContext from '@/webview/ImageManager/contexts/GlobalContext'

function useOperation() {
  const { compressor } = GlobalContext.usePicker(['compressor'])
  const _isCompressDisabled = useMemoizedFn((e: ItemParams<{ image: ImageType }>) => {
    const supportedExts = compressor?.config.exts
    if (supportedExts?.includes(e.props?.image.extraPathInfo.ext || '')) {
      return false
    }
    return true
  })
  const isCompressDisabled = _isCompressDisabled as BooleanPredicate

  return {
    isCompressDisabled,
  }
}

export default useOperation
