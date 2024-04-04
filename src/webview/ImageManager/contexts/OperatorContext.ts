import { useSetState } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { type ImageOperatorProps } from '../components/ImageOperator'

type OperatorType = Pick<ImageOperatorProps, 'images' | 'open'>

function useOperatorContext() {
  const [compressorModal, setCompressorModal] = useSetState<OperatorType>({
    open: false,
    images: [],
  })

  const [formatConverterModal, setFormatConverterModal] = useSetState<OperatorType>({
    open: false,
    images: [],
  })

  return {
    compressorModal,
    setCompressorModal,
    formatConverterModal,
    setFormatConverterModal,
  }
}

const OperatorContext = createContainer(useOperatorContext)

export default OperatorContext
