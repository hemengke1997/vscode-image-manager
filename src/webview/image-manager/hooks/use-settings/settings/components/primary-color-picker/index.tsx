import { memo, type ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TinyColor } from '@ctrl/tinycolor'
import { useMemoizedFn } from 'ahooks'
import { useControlledState } from 'ahooks-x'
import { ColorPicker, type ColorPickerProps } from 'antd'
import { uniq } from 'lodash-es'
import { builtInColors, vscodeColors } from '~/webview/ui-framework/src/utils/theme'

type Props = {
  value?: string
  onChange?: (color: string) => void
  extraColors?: string[]
  children?: ReactNode
  rencentColors: string[]
  onRencentColorsChange: (colors: string[]) => void
  colorPickerProps?: ColorPickerProps
}

function PrimaryColorPicker(props: Props) {
  const { t } = useTranslation()

  const { value, onChange, extraColors, rencentColors, onRencentColorsChange, colorPickerProps } = props

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
      showText={true}
      {...colorPickerProps}
    ></ColorPicker>
  )
}

export default memo(PrimaryColorPicker)
