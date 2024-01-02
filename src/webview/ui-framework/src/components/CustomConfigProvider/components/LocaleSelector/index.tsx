import { useLocalStorageState } from '@minko-fe/react-hook'
import { localStorageEnum } from '@root/webview/local-storage'
import { Button, Dropdown, type MenuProps } from 'antd'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { PiTranslateFill } from 'react-icons/pi'

function LocaleSelector() {
  const { i18n } = useTranslation()

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
          <div className={'text-ant-color-primary flex-center text-xl'}>
            <PiTranslateFill />
          </div>
        }
        type='text'
      ></Button>
    </Dropdown>
  )
}

export default memo(LocaleSelector)
