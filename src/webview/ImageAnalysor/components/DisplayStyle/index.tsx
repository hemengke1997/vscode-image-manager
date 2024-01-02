import { useControlledState } from '@minko-fe/react-hook'
import { Radio } from 'antd'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

type DisplayStyleProps = {
  value?: 'flat' | 'nested'
  onChange: (style: 'flat' | 'nested') => void
}

function DisplayStyle(props: DisplayStyleProps) {
  const { value, onChange } = props

  const { t } = useTranslation()

  const [displayStyle, setDisplayStyle] = useControlledState({
    defaultValue: 'nested',
    value,
    onChange,
  })

  return (
    <Radio.Group
      options={[
        {
          label: t('ia.nested'),
          value: 'nested',
        },
        {
          label: t('ia.flat'),
          value: 'flat',
        },
      ]}
      value={displayStyle}
      onChange={(e) => {
        setDisplayStyle(e.target.value)
      }}
    ></Radio.Group>
  )
}

export default memo(DisplayStyle)
