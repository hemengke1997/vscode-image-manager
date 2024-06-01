import { upperFirst } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { Button, Popover } from 'antd'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { IoIosMore } from 'react-icons/io'
import ActionContext from '~/webview/image-manager/contexts/action-context'

function More() {
  const { t } = useTranslation()
  const { setCollapseOpen } = ActionContext.usePicker(['setCollapseOpen'])

  const toggleAllCollapse = useMemoizedFn((b: boolean) => {
    setCollapseOpen((t) => t + (b ? 1 : -1))
  })
  return (
    <Popover
      title={upperFirst(t('im.action'))}
      trigger='click'
      placement='left'
      content={
        <div>
          <div className={'flex items-center space-x-2'}>
            <div>{t('im.folder')}</div>
            <Button.Group>
              <Button
                onClick={() => {
                  toggleAllCollapse(true)
                }}
              >
                {t('im.expand')}
              </Button>
              <Button
                onClick={() => {
                  toggleAllCollapse(false)
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
