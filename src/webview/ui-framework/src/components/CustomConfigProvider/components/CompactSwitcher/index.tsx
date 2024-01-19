import { useControlledState } from '@minko-fe/react-hook'
import { Switch } from 'antd'
import { memo } from 'react'

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
