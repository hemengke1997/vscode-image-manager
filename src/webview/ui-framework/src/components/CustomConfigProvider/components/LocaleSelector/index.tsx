import { useUpdateEffect } from '@minko-fe/react-hook'
import { Button, Dropdown } from 'antd'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PiTranslateFill } from 'react-icons/pi'
import { ConfigKey } from '~/core/config/common'
import { useConfiguration } from '~/webview/hooks/useConfiguration'
import FrameworkContext from '~/webview/ui-framework/src/contexts/FrameworkContext'

function LocaleSelector() {
  const { i18n, t } = useTranslation()

  const { languageWithoutAuto } = FrameworkContext.usePicker(['languageWithoutAuto'])

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

  const { update } = useConfiguration()

  const [lang, setLang] = useState(languageWithoutAuto)

  const [loading, setLoading] = useState(false)

  useUpdateEffect(() => {
    i18n.changeLanguage(languageWithoutAuto)
  }, [languageWithoutAuto])

  return (
    <Dropdown
      menu={{
        items: locales,
        selectable: true,
        selectedKeys: [lang!],
        onSelect(info) {
          if (loading) return
          setLoading(true)
          const lang = info.key as Language
          update({ key: ConfigKey.appearance_language, value: lang }, () => {
            setLang(lang)
            setLoading(false)
          })
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
        loading={loading}
      ></Button>
    </Dropdown>
  )
}

export default memo(LocaleSelector)
