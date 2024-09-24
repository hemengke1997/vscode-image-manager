import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useControlledState } from 'ahooks-x'
import { Segmented } from 'antd'

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
    <Segmented
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
      value={displayStyle}
      onChange={(value) => {
        setDisplayStyle(value as DisplayStyleType)
      }}
      size='small'
    ></Segmented>
  )
}

export default memo(DisplayStyle)
