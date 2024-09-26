import { memo, useMemo } from 'react'
import { useControlledState } from 'ahooks-x'
import { Badge, Checkbox, theme } from 'antd'
import { difference, uniq } from 'lodash-es'
import { RxViewNone } from 'react-icons/rx'
import GlobalContext, { type RestrictImageFilterType } from '~/webview/image-manager/contexts/global-context'

export type DisplayTypeFilter = RestrictImageFilterType<{
  file_type: string[]
}>

type Props = {
  value?: string[]
  onChange?: (checked: string[], unchecked: string[]) => void
}

function DisplayType(props: Props) {
  const { token } = theme.useToken()
  const { value, onChange } = props

  const { imageState } = GlobalContext.usePicker(['imageState'])

  const allImageTypes = useMemo(() => uniq(imageState.data.flatMap((item) => item.fileTypes)).sort(), [imageState.data])
  const allImageFiles = useMemo(() => imageState.data.flatMap((item) => item.images), [imageState.data])

  const options = useMemo(() => {
    return allImageTypes.map((item) => {
      return {
        label: (
          <div className={'flex items-center gap-x-2'}>
            <span className={'w-16 truncate'}>{item}</span>

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
      onChange?.(value, difference(allImageTypes, value))
    },
  })

  return options.length ? (
    <Checkbox.Group value={checked} onChange={setChecked}>
      <div className={'flex flex-col gap-1'}>
        {options.map((item) => (
          <Checkbox key={item.value} value={item.value}>
            {item.label}
          </Checkbox>
        ))}
      </div>
    </Checkbox.Group>
  ) : (
    <RxViewNone className={'text-lg'} />
  )
}

export default memo(DisplayType)
