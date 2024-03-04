import { useUpdateEffect } from '@minko-fe/react-hook'
import { Button, Dropdown, type MenuProps } from 'antd'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { PiTranslateFill } from 'react-icons/pi'
import { ConfigKey } from '~/core/config/common'
import { useConfiguration } from '~/webview/hooks/useConfiguration'
import { useTrackConfigState } from '~/webview/hooks/useTrackConfigState'
import FrameworkContext from '~/webview/ui-framework/src/contexts/FrameworkContext'

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

function LocaleSelector() {
  const { i18n, t } = useTranslation()

  const language = FrameworkContext.useSelector((ctx) => ctx.extConfig.appearance.language)

  const { update } = useConfiguration()

  const [lang, setLang] = useTrackConfigState(language)

  useUpdateEffect(() => {
    i18n.changeLanguage(lang)
  }, [lang])

  return (
    <Dropdown
      menu={{
        items: locales,
        selectable: true,
        selectedKeys: [lang!],
        onSelect(info) {
          setLang(info.key as Language)
          update({ key: ConfigKey.appearance_language, value: info.key })
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
