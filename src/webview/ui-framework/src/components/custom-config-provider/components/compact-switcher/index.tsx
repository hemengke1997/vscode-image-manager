import { memo } from 'react'
import { useControlledState } from 'ahooks-x'
import { Switch } from 'antd'

type CompactSwitcherProps = {
  value: boolean
  onChange: (value: boolean) => void
}

// TODO: compact mode
function CompactSwitcher(props: CompactSwitcherProps) {
  const { value, onChange } = props

  const [checked, setChecked] = useControlledState({
    defaultValue: value,
    value,
    onChange,
  })

  return <Switch checked={checked} onChange={setChecked}></Switch>
}

export default memo(CompactSwitcher)
