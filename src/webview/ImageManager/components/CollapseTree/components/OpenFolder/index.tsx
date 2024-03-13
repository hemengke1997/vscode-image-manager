import { Button } from 'antd'
import { type PropsWithChildren, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { os } from 'un-detector'
import useImageOperation from '~/webview/ImageManager/hooks/useImageOperation'

function OpenFolder(
  props: PropsWithChildren<{
    path: string
  }>,
) {
  const { t } = useTranslation()
  const { children, path } = props
  const { openInOsExplorer } = useImageOperation()

  return (
    <Button
      className={'flex-center hover:text-ant-color-primary h-auto cursor-pointer p-1 text-lg transition-colors'}
      onClick={(e) => {
        e.stopPropagation()
        openInOsExplorer(path)
      }}
      type='text'
      title={os.isMac() ? t('im.reveal_in_os_mac') : t('im.reveal_in_os_windows')}
    >
      {children}
    </Button>
  )
}

export default memo(OpenFolder)
