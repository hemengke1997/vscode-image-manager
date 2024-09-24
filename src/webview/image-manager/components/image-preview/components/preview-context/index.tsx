import { type Dispatch, type SetStateAction } from 'react'
import { createContainer } from 'context-state'

type PreviewContextProps = {
  multipleClick: (previous: string[], path: string, shouldAdd: boolean) => string[]
  setSelectedImages: Dispatch<SetStateAction<string[]>>
  setPreview: Dispatch<
    SetStateAction<{
      open?: boolean
      current?: number
    }>
  >
  onContextMenu: (e: React.MouseEvent<HTMLDivElement>, image: ImageType) => void
}

function usePreviewContext(value: PreviewContextProps) {
  return value
}

const PreviewContext = createContainer(usePreviewContext)

export default PreviewContext
