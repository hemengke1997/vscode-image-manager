import { TinyColor } from '@ctrl/tinycolor'
import { uniq } from '@minko-fe/lodash-pro'
import { useControlledState, useLocalStorageState } from '@minko-fe/react-hook'
import { ColorPicker, type ColorPickerProps } from 'antd'
import { memo, startTransition } from 'react'
import { builtInColors } from '@/utils/theme'

type PrimaryColorPickerProps = {
  color?: string
  onColorChange: (color: string) => void
  localKey: string
  extraColors?: string[]
}

function PrimaryColorPicker(props: PrimaryColorPickerProps) {
  const { color: colorProp, onColorChange, localKey, extraColors } = props

  const color = new TinyColor(colorProp).toHexString()
  const formattedExtraColors = extraColors?.map((t) => new TinyColor(t).toHexString())

  const [selectedColor, setSelectedColor] = useControlledState({
    defaultValue: color,
    value: color,
    onChange: onColorChange,
  })

  const [recentColorsQueue, setRecentColorsQueue] = useLocalStorageState<string[]>(localKey, {
    defaultValue: [color || ''],
  })

  const _onColorChange: ColorPickerProps['onChange'] = (color) => {
    startTransition(() => setSelectedColor(color.toHexString()))
  }

  const onOpenChange: ColorPickerProps['onOpenChange'] = (open) => {
    if (!open) {
      // store recent 5 colors
      let newRecentColorsQueue = [...(recentColorsQueue || [])]
      newRecentColorsQueue.unshift(selectedColor)
      // remove duplicate colors
      newRecentColorsQueue = uniq(newRecentColorsQueue)

      if (newRecentColorsQueue.length > 5) {
        newRecentColorsQueue.pop()
      }
      setRecentColorsQueue(newRecentColorsQueue)
    }
  }

  return (
    <div>
      <ColorPicker
        disabledAlpha
        format='hex'
        presets={[
          {
            label: 'Built-in',
            colors: [...(formattedExtraColors || []), ...builtInColors.map((t) => t.primary)],
          },
          {
            label: 'Recent',
            colors: recentColorsQueue || [],
          },
        ]}
        value={selectedColor}
        onChange={_onColorChange}
        onOpenChange={onOpenChange}
      />
    </div>
  )
}

export default memo(PrimaryColorPicker)
