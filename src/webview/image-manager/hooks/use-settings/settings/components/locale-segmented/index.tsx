import { memo } from 'react'
import { useControlledState } from 'ahooks-x'
import { Segmented } from 'antd'
import { locales } from '~/meta'

type Props = {
  value?: Language
  onChange?: (language: Language) => void
}

function LocaleSegmented(props: Props) {
  const { value, onChange } = props
  const [language, setLanguage] = useControlledState({
    defaultValue: value,
    value,
    onChange,
  })

  return (
    <div>
      <Segmented
        options={locales.map((t) => ({
          value: t.key,
          label: t.label,
        }))}
        value={language}
        onChange={(value) => {
          setLanguage(value)
        }}
      />
    </div>
  )
}

export default memo(LocaleSegmented)
