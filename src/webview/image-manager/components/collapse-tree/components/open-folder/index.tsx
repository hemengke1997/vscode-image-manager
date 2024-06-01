import { Button } from 'antd'
import { type PropsWithChildren, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { os } from 'un-detector'
import useImageOperation from '~/webview/image-manager/hooks/use-image-operation'

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
      className={'hover:text-ant-color-primary flex h-auto cursor-pointer items-center p-1 text-lg transition-colors'}
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
