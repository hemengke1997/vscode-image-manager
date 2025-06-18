import { useMemoizedFn } from 'ahooks'
import { Checkbox, type CheckboxOptionType } from 'antd'
import { memo, type ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DisplayGroupType } from '~/core/persist/workspace/common'
import { useControlledState } from '~/webview/image-manager/hooks/use-controlled-state'
import Preview from '../preview'
import Composite from './images/composite.png?base64'
import Dir from './images/dir.png?base64'
import FileType from './images/file_type.png?base64'
import None from './images/none.png?base64'

interface DisplayGroupProps<T> {
  value?: T[]
  onChange?: (checked: T[]) => void
}

function DisplayGroup<T extends string = DisplayGroupType>(props: DisplayGroupProps<T>) {
  const { value, onChange } = props
  const { t } = useTranslation()

  /* ---------------- image group --------------- */
  const groupType: { label: ReactNode, value: DisplayGroupType }[] = useMemo(
    () => [
      {
        label: t('im.group_by_dir'),
        value: DisplayGroupType.dir,
        image: Dir,
      },
      {
        label: t('im.group_by_type'),
        value: DisplayGroupType.extname,
        image: FileType,
      },
    ],
    [t],
  )

  const [groups, setGroups] = useControlledState<T[]>({
    value,
    onChange,
  })

  const image = useMemoizedFn(() => {
    if (groups.length === 0) {
      // 平铺
      return None
    }

    if (groups.length === 1) {
      if (groups[0] === DisplayGroupType.dir) {
        // 目录
        return Dir
      }
      if (groups[0] === DisplayGroupType.extname) {
        // 文件类型
        return FileType
      }
    }

    // 目录 + 文件类型
    return Composite
  })

  return (
    <div className='flex items-center'>
      <Checkbox.Group
        options={groupType.map(item => ({ label: item.label, value: item.value })) as CheckboxOptionType[]}
        onChange={setGroups}
        value={groups}
      >
      </Checkbox.Group>
      <Preview image={image()} className='w-[200px]'></Preview>
    </div>
  )
}

export default memo(DisplayGroup) as typeof DisplayGroup
