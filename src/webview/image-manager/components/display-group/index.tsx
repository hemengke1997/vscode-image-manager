import { useControlledState } from '@minko-fe/react-hook'
import { Checkbox, type CheckboxOptionType } from 'antd'
import { memo, type ReactNode, startTransition, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { type WorkspaceStateType } from '~/core/persist/workspace/common'

export type GroupType = WorkspaceStateType['display_group'][number]

type DisplayGroupProps<T> = {
  value?: T[]
  onChange?: (checked: T[]) => void
}

function DisplayGroup<T extends string = GroupType>(props: DisplayGroupProps<T>) {
  const { value, onChange } = props
  const { t } = useTranslation()

  /* ---------------- image group --------------- */
  const groupType: { label: ReactNode; value: GroupType; hidden?: boolean }[] = useMemo(
    () => [
      {
        label: 'TODO: workspace',
        value: 'workspace',
        hidden: true,
      },
      {
        label: t('im.group_by_dir'),
        value: 'dir',
      },
      {
        label: t('im.group_by_type'),
        value: 'type',
      },
    ],
    [t],
  )

  const [groups, setGroups] = useControlledState<T[]>({
    defaultValue: value,
    value,
    onChange,
  })

  return (
    <>
      <Checkbox.Group
        options={
          groupType
            .filter((t) => !t.hidden)
            .map((item) => ({ label: item.label, value: item.value })) as CheckboxOptionType[]
        }
        onChange={(checked) => {
          startTransition(() => setGroups(checked as T[]))
        }}
        value={groups}
      ></Checkbox.Group>
    </>
  )
}

export default memo(DisplayGroup) as typeof DisplayGroup
