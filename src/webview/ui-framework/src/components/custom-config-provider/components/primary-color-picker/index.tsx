import { TinyColor } from '@ctrl/tinycolor'
import { useMemoizedFn } from 'ahooks'
import { Button, ColorPicker, type ColorPickerProps } from 'antd'
import { uniq } from 'lodash-es'
import { memo, type ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MdOutlineColorLens } from 'react-icons/md'
import { useControlledState } from 'x-ahooks'
import { builtInColors, vscodeColors } from '~/webview/ui-framework/src/utils/theme'

type PrimaryColorPickerProps = {
  value?: string
  onChange: (color: string) => void
  extraColors?: string[]
  children?: ReactNode
  rencentColors: string[]
  onRencentColorsChange: (colors: string[]) => void
  title?: string
}

function PrimaryColorPicker(props: PrimaryColorPickerProps) {
  const { t } = useTranslation()

  const { value, onChange, extraColors, rencentColors, onRencentColorsChange, title } = props

  const color = useMemo(() => new TinyColor(value).toHex8String(), [value])

  const formattedExtraColors = useMemo(() => extraColors?.map((t) => new TinyColor(t).toHexString()), [extraColors])

  const [selectedColor, setSelectedColor] = useControlledState({
    defaultValue: color,
    value: color,
    onChange,
  })

  const [recentColorsQueue, setRecentColorsQueue] = useControlledState<string[]>({
    defaultValue: rencentColors.length ? rencentColors : [color],
    value: rencentColors,
    onChange: onRencentColorsChange,
  })

  const onColorChange: ColorPickerProps['onChangeComplete'] = useMemoizedFn((color) => {
    setSelectedColor(color.toHexString())
  })

  const onOpenChange: ColorPickerProps['onOpenChange'] = useMemoizedFn(() => {
    if (selectedColor === recentColorsQueue?.[0]) return
    let newRecentColorsQueue = [...(recentColorsQueue || [])]
    newRecentColorsQueue.unshift(selectedColor)
    newRecentColorsQueue = uniq(newRecentColorsQueue)

    if (newRecentColorsQueue.length > 5) {
      newRecentColorsQueue.pop()
    }
    setRecentColorsQueue(newRecentColorsQueue)
  })

  return (
    <ColorPicker
      disabledAlpha={false}
      presets={[
        {
          label: 'VSCode',
          colors: uniq([...vscodeColors]),
        },
        {
          label: t('im.bulit_in'),
          colors: uniq([...(formattedExtraColors || []), ...builtInColors.map((t) => t.primary)]),
        },
        {
          label: t('im.recent'),
          colors: uniq(recentColorsQueue || []),
        },
      ]}
      value={selectedColor}
      onChangeComplete={onColorChange}
      onOpenChange={onOpenChange}
      placement='bottom'
    >
      <Button
        title={title}
        type='text'
        icon={
          <div className={'flex items-center text-2xl'}>
            <MdOutlineColorLens />
          </div>
        }
      ></Button>
    </ColorPicker>
  )
}

export default memo(PrimaryColorPicker)
