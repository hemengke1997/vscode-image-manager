import { type PropsWithChildren, memo } from 'react'
import useImageOperation from '@/webview/ImageManager/hooks/useImageOperation'

function OpenFolder(
  props: PropsWithChildren<{
    path: string
  }>,
) {
  const { children, path } = props
  const { openInOsExplorer } = useImageOperation()

  return (
    <i
      className={'flex-center hover:text-ant-color-primary cursor-pointer transition-colors'}
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
