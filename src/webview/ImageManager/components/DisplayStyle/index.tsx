import { useControlledState } from '@minko-fe/react-hook'
import { Radio } from 'antd'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

export type DisplayStyleType = 'compact' | 'nested'

type DisplayStyleProps = {
  value?: DisplayStyleType
  onChange: (style: DisplayStyleType) => void
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
          label: t('im.compact'),
          value: 'compact',
        },
        {
          label: t('im.nested'),
          value: 'nested',
        },
      ]}
      optionType='button'
      buttonStyle='solid'
      value={displayStyle}
      onChange={(e) => {
        setDisplayStyle(e.target.value)
      }}
    ></Radio.Group>
  )
}

export default memo(DisplayStyle)
