import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useControlledState } from 'ahooks-x'
import { Button, Dropdown } from 'antd'
import { PiTranslateFill } from 'react-icons/pi'
import { locales } from '~/meta'

type LocaleSelectorProps = {
  value: Language
  onChange: (language: Language) => void
}

function LocaleSelector(props: LocaleSelectorProps) {
  const { value, onChange } = props
  const { t } = useTranslation()

  const [language, setLanguage] = useControlledState({
    defaultValue: value,
    value,
    onChange,
  })

  return (
    <Dropdown
      menu={{
        items: locales,
        selectable: true,
        selectedKeys: [language],
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
          <div className={'flex items-center text-2xl'}>
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
