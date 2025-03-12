import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbRefresh } from 'react-icons/tb'
import { useMemoizedFn } from 'ahooks'
import { Button, Tooltip } from 'antd'
import delay from 'delay'
import { classNames } from 'tw-clsx'
import { RefreshImageDebounceTimeout } from '~/webview/image-manager/hooks/use-refresh-images'
import ActionStore from '~/webview/image-manager/stores/action-store'

function Refresh() {
  const { t } = useTranslation()
  const { refreshImages } = ActionStore.useStore(['refreshImages'])

  const [loading, setLoading] = useState(false)

  const handleRefresh = useMemoizedFn(async () => {
    if (loading) return
    setLoading(true)
    refreshImages({ type: 'refresh' })
    await delay(RefreshImageDebounceTimeout + 100)
    setLoading(false)
  })

  return (
    <Tooltip title={t('im.refresh')} arrow={false} placement={'bottom'}>
      <Button
        type='text'
        icon={
          <div className={classNames('flex items-center text-xl', loading && 'animate-spin cursor-default')}>
            <TbRefresh />
          </div>
        }
        onClick={handleRefresh}
      ></Button>
    </Tooltip>
  )
}

export default memo(Refresh)
