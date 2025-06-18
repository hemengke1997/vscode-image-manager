import { useMemoizedFn } from 'ahooks'
import { App, Button, Tooltip } from 'antd'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbRefresh } from 'react-icons/tb'
import useUpdateImages from '~/webview/image-manager/hooks/use-update-images'
import { classNames } from '~/webview/image-manager/utils/tw-clsx'

function Refresh() {
  const { t } = useTranslation()
  const { message } = App.useApp()

  const [loading, setLoading] = useState(false)

  const { getAllImages } = useUpdateImages()

  const handleRefresh = useMemoizedFn(async () => {
    if (loading)
      return

    const messageKey = 'refresh_images'

    const timer = window.setTimeout(() => {
      message.loading({
        content: t('im.img_refreshing'),
        key: messageKey,
        duration: 0,
      })
      clearTimeout(timer)
    }, 200)

    setLoading(true)
    try {
      await getAllImages()
    }
    finally {
      clearTimeout(timer)
      setLoading(false)
    }

    message.destroy(messageKey)
    message.success(t('im.img_refreshed'))
  })

  return (
    <Tooltip title={t('im.refresh')} arrow={false} placement='bottom'>
      <Button
        type='text'
        icon={(
          <div className={classNames('flex items-center text-xl', loading && 'animate-spin cursor-default')}>
            <TbRefresh />
          </div>
        )}
        onClick={handleRefresh}
      >
      </Button>
    </Tooltip>
  )
}

export default memo(Refresh)
