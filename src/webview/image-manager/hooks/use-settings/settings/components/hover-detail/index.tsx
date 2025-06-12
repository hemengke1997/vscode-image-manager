import { memo } from 'react'
import { useControlledState } from 'ahooks-x'
import { Checkbox } from 'antd'
import Preview from '../preview'
import With from './images/with.png?base64'
import Without from './images/without.png?base64'

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

  const image = checked ? With : Without

  return (
    <div className={'flex items-center gap-x-2'}>
      <Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />
      <Preview image={image} className={'w-[100px]'}></Preview>
    </div>
  )
}

export default memo(HoverDetail)
