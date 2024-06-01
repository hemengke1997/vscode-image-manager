import { useSetState } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { type ImageCompressorProps } from '../components/image-compressor'
import { type ImageOperatorProps } from '../components/image-operator'
import { type ImageSimilarityProps } from '../components/image-similarity'

type OperatorType = Pick<ImageOperatorProps, 'images' | 'open'> & {
  closed: boolean
}

export type CompressorModalStateType = OperatorType & {
  fields?: ImageCompressorProps['fields']
}

function useOperatorContext() {
  const [compressorModal, setCompressorModal] = useSetState<CompressorModalStateType>({
    open: false,
    closed: true,
    images: [],
    fields: {},
  })

  const [formatConverterModal, setFormatConverterModal] = useSetState<OperatorType>({
    open: false,
    closed: true,
    images: [],
  })

  const [similarityModal, setSimilarityModal] = useSetState<
    Pick<ImageSimilarityProps, 'open' | 'image' | 'similarImages'> & { closed: boolean }
  >({
    open: false,
    closed: true,
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
