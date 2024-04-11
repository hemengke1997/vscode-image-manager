import { useSetState } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { type ImageOperatorProps } from '../components/ImageOperator'
import { type ImageSimilarityProps } from '../components/ImageSimilarity'

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

  const [similarityModal, setSimilarityModal] = useSetState<
    Pick<ImageSimilarityProps, 'open' | 'image' | 'similarImages'>
  >({
    open: false,
    similarImages: [],
    image: {} as ImageType,
  })

  return {
    compressorModal,
    setCompressorModal,
    formatConverterModal,
    setFormatConverterModal,
    similarityModal,
    setSimilarityModal,
  }
}

const OperatorContext = createContainer(useOperatorContext)

export default OperatorContext
