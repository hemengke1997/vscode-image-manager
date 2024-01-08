import useImageOperation from '@rootSrc/webview/ImageManager/hooks/useImageOperation'
import { type PropsWithChildren, memo } from 'react'

function OpenFolder(
  props: PropsWithChildren<{
    path: string
  }>,
) {
  const { children, path } = props
  const { openInOsExplorer } = useImageOperation()

  return (
    <i
      className={'flex-center hover:text-ant-color-primary transition-colors'}
      onClick={(e) => {
        e.stopPropagation()
        openInOsExplorer(path)
      }}
    >
      {children}
    </i>
  )
}

export default memo(OpenFolder)
