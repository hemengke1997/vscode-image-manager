import { useSetState } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { type ImageOperatorProps } from '../components/ImageOperator'

function useOperatorContext() {
  const [operatorModal, setOperatorModal] = useSetState<ImageOperatorProps>({
    open: false,
    images: [],
  })
  return {
    operatorModal,
    setOperatorModal,
  }
}

const OperatorContext = createContainer(useOperatorContext)

export default OperatorContext
