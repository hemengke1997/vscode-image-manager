import { useSetState } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'

function useCropperContext() {
  const [cropperProps, setCropperProps] = useSetState<{ open: boolean; image: ImageType | undefined }>({
    open: false,
    image: undefined,
  })

  return {
    cropperProps,
    setCropperProps,
  }
}

const CroppoerContext = createContainer(useCropperContext)

export default CroppoerContext
