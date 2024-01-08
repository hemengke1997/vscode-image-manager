import { useControlledState } from '@minko-fe/react-hook'
import { Checkbox, type CheckboxOptionType } from 'antd'
import { memo, startTransition } from 'react'

export type GroupType = 'workspace' | 'dir' | 'type'

type DisplayGroupProps<T> = {
  options: CheckboxOptionType[]
  value?: T[]
  onChange?: (checked: T[]) => void
}

function DisplayGroup<T extends string = GroupType>(props: DisplayGroupProps<T>) {
  const { options, value, onChange } = props

  const [groups, setGroups] = useControlledState<T[]>({
    defaultValue: value,
    value,
    onChange,
  })

  return (
    <>
      <Checkbox.Group
        options={options}
        onChange={(checked) => {
          startTransition(() => setGroups(checked as T[]))
        }}
        value={groups}
      ></Checkbox.Group>
    </>
  )
}

export default memo(DisplayGroup) as typeof DisplayGroup
