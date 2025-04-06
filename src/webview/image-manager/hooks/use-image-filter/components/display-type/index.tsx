import { memo, useMemo } from 'react'
import { RxViewNone } from 'react-icons/rx'
import { useControlledState } from 'ahooks-x'
import { Badge, Checkbox, theme } from 'antd'
import { difference, uniq } from 'es-toolkit'
import ImageStore from '~/webview/image-manager/stores/image-store'

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

  const { imageState } = ImageStore.useStore(['imageState'])

  const allImageTypes = useMemo(() => {
    return uniq(
      imageState.workspaces.reduce((acc, item) => {
        const types = item.images.map((image) => image.extname)
        return acc.concat(types)
      }, [] as string[]),
    )
  }, [imageState.workspaces])

  const allImageFiles = useMemo(() => imageState.workspaces.flatMap((item) => item.images), [imageState.workspaces])

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
