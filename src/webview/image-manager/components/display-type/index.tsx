import { difference, uniq } from '@minko-fe/lodash-pro'
import { useControlledState, useUpdateEffect } from '@minko-fe/react-hook'
import { Badge, Checkbox, theme } from 'antd'
import { produce } from 'immer'
import { memo, useMemo } from 'react'
import { RxViewNone } from 'react-icons/rx'
import GlobalContext, { type RestrictImageFilterType } from '../../contexts/global-context'

export type DisplayTypeFilter = RestrictImageFilterType<{
  file_type: string[]
}>

type DisplayTypeProps = {
  value: string[]
  onChange: (checked: string[], unchecked: string[]) => void
}

function DisplayType(props: DisplayTypeProps) {
  const { token } = theme.useToken()
  const { value, onChange } = props

  const { imageState, setImageFilter } = GlobalContext.usePicker(['imageState', 'setImageFilter'])

  const allImageTypes = useMemo(() => uniq(imageState.data.flatMap((item) => item.fileTypes)).sort(), [imageState.data])
  const allImageFiles = useMemo(() => imageState.data.flatMap((item) => item.images), [imageState.data])

  const options = useMemo(() => {
    return allImageTypes.map((item) => {
      return {
        label: (
          <div className={'flex items-center gap-x-2'}>
            <span>{item}</span>

            <Badge
              overflowCount={Number.POSITIVE_INFINITY}
              color={token.colorPrimary}
              count={allImageFiles.filter((t) => t.fileType === item).length}
              showZero
              style={{
                color: token.colorWhite,
              }}
            />
          </div>
        ),
        value: item,
      }
    })
  }, [allImageTypes, token, allImageFiles])

  const [checked, setChecked] = useControlledState({
    defaultValue: value,
    value,
    onChange: (value) => {
      onChange(value, difference(allImageTypes, value))
    },
  })

  useUpdateEffect(() => {
    setImageFilter(
      produce((draft) => {
        draft.file_type = checked
      }),
    )
  }, [checked])

  return options.length ? (
    <Checkbox.Group value={checked} onChange={setChecked} options={options}></Checkbox.Group>
  ) : (
    <RxViewNone className={'text-lg'} />
  )
}

export default memo(DisplayType)
