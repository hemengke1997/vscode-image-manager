import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IoIosMore } from 'react-icons/io'
import { useMemoizedFn } from 'ahooks'
import { Button, Popover, Space, Tooltip } from 'antd'
import { upperFirst } from 'es-toolkit'
import ActionStore from '~/webview/image-manager/stores/action-store'

function More() {
  const { t } = useTranslation()
  const { openAllCollapse, closeAllCollapse } = ActionStore.useStore(['openAllCollapse', 'closeAllCollapse'])

  const [open, setOpen] = useState(false)

  const toggleAllCollapse = useMemoizedFn((open: boolean) => {
    open ? openAllCollapse() : closeAllCollapse()
  })

  return (
    <Popover
      title={upperFirst(t('im.action'))}
      trigger={['click']}
      placement='left'
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
      }}
      arrow={false}
      overlayClassName={'select-none'}
      content={
        <div className={'flex flex-col gap-2'}>
          <div className={'flex items-center space-x-2'}>
            <div>{t('im.folder')}</div>
            <Space.Compact>
              <Button
                onClick={() => {
                  toggleAllCollapse(true)
                  setOpen(false)
                }}
              >
                {t('im.expand')}
              </Button>
              <Button
                onClick={() => {
                  toggleAllCollapse(false)
                  setOpen(false)
                }}
              >
                {t('im.collapse')}
              </Button>
            </Space.Compact>
          </div>
        </div>
      }
    >
      <Tooltip title={upperFirst(t('im.action'))} arrow={false} placement={'bottom'}>
        <Button
          type='text'
          icon={
            <div className={'flex items-center text-xl'}>
              <IoIosMore />
            </div>
          }
        />
      </Tooltip>
    </Popover>
  )
}

export default memo(More)
