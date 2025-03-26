import { memo, useMemo } from 'react'
import { RxViewNone } from 'react-icons/rx'
import { useControlledState } from 'ahooks-x'
import { Badge, Checkbox, theme } from 'antd'
import { difference } from 'es-toolkit'
import GlobalStore from '~/webview/image-manager/stores/global-store'

type Props = {
  /**
   * 接收的参数是未选中的值
   */
  value?: string[]
  onChange?: (exclude: string[]) => void
}

function DisplayType(props: Props) {
  const { token } = theme.useToken()
  const { value, onChange } = props

  const imageStateData = GlobalStore.useStore((ctx) => ctx.imageState.data)
  const { allImageTypes } = GlobalStore.useStore(['imageState', 'allImageTypes'])

  const allImageFiles = useMemo(() => imageStateData.flatMap((item) => item.images), [imageStateData])

  const options = useMemo(() => {
    const sortedImageTypes = allImageTypes
      .map((type) => {
        return {
          type,
          length: allImageFiles.filter((t) => t.extname === type).length,
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

  const [exclude, setExclude] = useControlledState({
    defaultValue: value,
    value,
    onChange: (checked) => {
      onChange?.(difference(allImageTypes, checked))
    },
  })

  const checked = useMemo(() => difference(allImageTypes, exclude), [allImageTypes, exclude])

  return options.length ? (
    <Checkbox.Group value={checked} onChange={setExclude}>
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
