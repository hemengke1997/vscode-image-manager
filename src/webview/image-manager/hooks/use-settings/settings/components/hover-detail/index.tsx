import { memo } from 'react'
import { useControlledState } from 'ahooks-x'
import { Checkbox } from 'antd'

type Props = {
  value?: boolean
  onChange?: (value: boolean) => void
}

function HoverDetail(props: Props) {
  const { value, onChange } = props
  const [checked, setChecked] = useControlledState({
    defaultValue: value,
    value,
    onChange,
  })

  return <Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />
}

export default memo(HoverDetail)
