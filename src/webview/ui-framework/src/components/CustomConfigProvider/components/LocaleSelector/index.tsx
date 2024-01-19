import { useLocalStorageState } from '@minko-fe/react-hook'
import { Button, Dropdown, type MenuProps } from 'antd'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { PiTranslateFill } from 'react-icons/pi'
import { localStorageEnum } from '@/webview/local-storage'

function LocaleSelector() {
  const { i18n, t } = useTranslation()

  const [lang, setLang] = useLocalStorageState(localStorageEnum.LOCAL_STORAGE_LOCALE_KEY, {
    defaultValue: i18n.language,
  })

  // webview/locales/*.json
  const locales: MenuProps['items'] = [
    {
      key: 'en',
      label: 'English',
    },
    {
      key: 'zh-cn',
      label: '简体中文',
    },
  ]

  return (
    <Dropdown
      menu={{
        items: locales,
        selectable: true,
        selectedKeys: [lang!],
        onSelect(info) {
          i18n.changeLanguage(info.key)
          setLang(info.key)
        },
      }}
      trigger={['click']}
      placement='bottom'
      arrow={false}
    >
      <Button
        icon={
          <div className={'text-ant-color-primary flex-center text-2xl'}>
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
