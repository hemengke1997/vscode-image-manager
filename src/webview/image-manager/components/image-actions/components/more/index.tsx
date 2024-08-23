import { useMemoizedFn } from 'ahooks'
import { Button, Popover } from 'antd'
import { upperFirst } from 'lodash-es'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IoIosMore } from 'react-icons/io'
import ActionContext from '~/webview/image-manager/contexts/action-context'

function More() {
  const { t } = useTranslation()
  const { setCollapseOpen } = ActionContext.usePicker(['setCollapseOpen'])

  const [open, setOpen] = useState(false)

  const toggleAllCollapse = useMemoizedFn((b: boolean) => {
    setCollapseOpen((t) => t + (b ? 1 : -1))
  })
  return (
    <Popover
      title={upperFirst(t('im.action'))}
      trigger='click'
      placement='left'
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
      }}
      content={
        <div>
          <div className={'flex items-center space-x-2'}>
            <div>{t('im.folder')}</div>
            <Button.Group>
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
            </Button.Group>
          </div>
        </div>
      }
    >
      <Button
        type='text'
        icon={
          <div className={'flex items-center text-xl'}>
            <IoIosMore />
          </div>
        }
        title={t('im.action')}
      />
    </Popover>
  )
}

export default memo(More)
