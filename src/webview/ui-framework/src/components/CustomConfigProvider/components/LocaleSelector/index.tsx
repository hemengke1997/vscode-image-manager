import { useUpdateEffect } from '@minko-fe/react-hook'
import { Button, Dropdown, type MenuProps } from 'antd'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PiTranslateFill } from 'react-icons/pi'
import { ConfigKey } from '~/core/config/common'
import { useConfiguration } from '~/webview/hooks/useConfiguration'
import FrameworkContext from '~/webview/ui-framework/src/contexts/FrameworkContext'

function LocaleSelector() {
  const { i18n, t } = useTranslation()
  const language = FrameworkContext.useSelector((ctx) => ctx.extConfig.appearance.language)

  const { update } = useConfiguration()

  const [lang, setLang] = useState(i18n.language)

  // webview/locales/*.json
  const locales: MenuProps['items'] = [
    {
      key: 'en',
      label: 'English',
    },
    {
      key: 'zh-CN',
      label: '简体中文',
    },
  ]

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    setLang(lang)
  }

  useUpdateEffect(() => {
    changeLanguage(language)
  }, [language])

  return (
    <Dropdown
      menu={{
        items: locales,
        selectable: true,
        selectedKeys: [lang!],
        onSelect(info) {
          update({ key: ConfigKey.appearance_language, value: info.key }, () => {
            changeLanguage(info.key)
          })
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
