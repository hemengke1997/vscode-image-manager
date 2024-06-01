import { Button } from 'antd'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { TbRefresh } from 'react-icons/tb'
import ActionContext from '~/webview/image-manager/contexts/action-context'

function Refresh() {
  const { t } = useTranslation()
  const { refreshImages } = ActionContext.usePicker(['refreshImages'])

  return (
    <Button
      type='text'
      icon={
        <div className={'flex items-center text-xl'}>
          <TbRefresh />
        </div>
      }
      onClick={() => refreshImages({ type: 'refresh' })}
      title={t('im.refresh')}
    ></Button>
  )
}

export default memo(Refresh)
