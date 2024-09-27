import { memo, useMemo } from 'react'
import { useControlledState } from 'ahooks-x'
import { Badge, Checkbox, theme } from 'antd'
import { RxViewNone } from 'react-icons/rx'
import GlobalContext, { type RestrictImageFilterType } from '~/webview/image-manager/contexts/global-context'

export type DisplayTypeFilter = RestrictImageFilterType<{
  file_type: string[]
}>

type Props = {
  value?: string[]
  onChange?: (checked: string[]) => void
}

function DisplayType(props: Props) {
  const { token } = theme.useToken()
  const { value, onChange } = props

  const { imageState, allImageTypes } = GlobalContext.usePicker(['imageState', 'allImageTypes'])

  const allImageFiles = useMemo(() => imageState.data.flatMap((item) => item.images), [imageState.data])

  const options = useMemo(() => {
    const sortedImageTypes = allImageTypes
      .map((type) => {
        return {
          type,
          length: allImageFiles.filter((t) => t.fileType === type).length,
        }
      })
      .sort((a, b) => b.length - a.length)

    return sortedImageTypes.map((item) => {
      return {
        label: (
          <div className={'flex items-center gap-x-2'}>
            <span className={'w-16 truncate'}>{item.type}</span>

            <Badge
              overflowCount={Number.POSITIVE_INFINITY}
              color={token.colorPrimary}
              count={item.length}
              showZero
              style={{
                color: token.colorWhite,
              }}
            />
          </div>
        ),
        value: item.type,
      }
    })
  }, [allImageTypes, token, allImageFiles])

  const [checked, setChecked] = useControlledState({
    defaultValue: value,
    value,
    onChange: (value) => {
      onChange?.(value)
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
