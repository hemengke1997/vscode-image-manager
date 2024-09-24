import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMemoizedFn } from 'ahooks'
import { Button } from 'antd'
import delay from 'delay'
import { TbRefresh } from 'react-icons/tb'
import { classNames } from 'tw-clsx'
import ActionContext from '~/webview/image-manager/contexts/action-context'
import { RefreshImageDebounceTimeout } from '~/webview/image-manager/hooks/use-refresh-images'

function Refresh() {
  const { t } = useTranslation()
  const { refreshImages } = ActionContext.usePicker(['refreshImages'])

  const [loading, setLoading] = useState(false)

  const handleRefresh = useMemoizedFn(async () => {
    if (loading) return
    setLoading(true)
    refreshImages({ type: 'refresh' })
    await delay(RefreshImageDebounceTimeout + 100)
    setLoading(false)
  })

  return (
    <Button
      type='text'
      icon={
        <div className={classNames('flex items-center text-xl', loading && 'animate-spin cursor-default')}>
          <TbRefresh />
        </div>
      }
      onClick={handleRefresh}
      title={t('im.refresh')}
    ></Button>
  )
}

export default memo(Refresh)
