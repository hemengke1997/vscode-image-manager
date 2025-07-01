import { Segmented } from 'antd'
import { memo } from 'react'
import { locales } from '~/meta'
import { useControlledState } from '~/webview/image-manager/hooks/use-controlled-state'

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
        options={locales.map(t => ({
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
