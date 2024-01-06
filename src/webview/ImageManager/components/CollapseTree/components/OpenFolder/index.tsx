import ImageManagerContext from '@rootSrc/webview/ImageManager/contexts/ImageManagerContext'
import useImageOperation from '@rootSrc/webview/ImageManager/hooks/useImageOperation'
import { type PropsWithChildren, memo } from 'react'

function OpenFolder(
  props: PropsWithChildren<{
    path: string
  }>,
) {
  const { children, path } = props
  const { openInOsExplorer } = useImageOperation()
  const { images } = ImageManagerContext.usePicker(['images'])

  return (
    <i
      className={'flex-center hover:text-ant-color-primary transition-colors'}
      onClick={(e) => {
        e.stopPropagation()
        openInOsExplorer(`${images.basePath}/${path}`)
      }}
    >
      {children}
    </i>
  )
}

export default memo(OpenFolder)
