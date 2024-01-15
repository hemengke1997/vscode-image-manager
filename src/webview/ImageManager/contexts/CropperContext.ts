import { createContainer } from 'context-state'
import { useState } from 'react'
import { type ImageType } from '..'

function useCropperContext() {
  const [cropperProps, setCropperProps] = useState<{ open: boolean; image: ImageType | undefined }>({
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
