import { useUpdateEffect } from '@minko-fe/react-hook'
import { Button, Dropdown } from 'antd'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { PiTranslateFill } from 'react-icons/pi'
import FrameworkContext from '~/webview/ui-framework/src/contexts/FrameworkContext'

function LocaleSelector() {
  const { i18n, t } = useTranslation()

  const { languageWithoutAuto, setLanguage } = FrameworkContext.usePicker(['languageWithoutAuto', 'setLanguage'])

  // webview/locales/*.json
  const locales = [
    {
      key: 'en',
      label: 'English',
    },
    {
      key: 'zh-CN',
      label: '简体中文',
    },
  ]

  useUpdateEffect(() => {
    i18n.changeLanguage(languageWithoutAuto)
  }, [languageWithoutAuto])

  return (
    <Dropdown
      menu={{
        items: locales,
        selectable: true,
        selectedKeys: [languageWithoutAuto],
        onSelect(info) {
          setLanguage(info.key as Language)
        },
      }}
      placement='bottom'
      arrow={false}
      trigger={['click']}
    >
      <Button
        icon={
          <div className={'flex-center text-2xl'}>
            <PiTranslateFill />
          </div>
        }
        type='text'
        title={t('im.language')}
      ></Button>
    </Dropdown>
  )
}

export default memo(LocaleSelector)
