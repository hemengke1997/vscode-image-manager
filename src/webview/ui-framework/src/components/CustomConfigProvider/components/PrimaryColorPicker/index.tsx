import { TinyColor } from '@ctrl/tinycolor'
import { uniq } from '@minko-fe/lodash-pro'
import { useControlledState, useLocalStorageState } from '@minko-fe/react-hook'
import { ColorPicker, type ColorPickerProps } from 'antd'
import { type ReactNode, memo, startTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { builtInColors, vscodeColors } from '@/webview/ui-framework/src/utils/theme'

type PrimaryColorPickerProps = {
  color?: string
  onColorChange: (color: string) => void
  localKey: string
  extraColors?: string[]
  children?: ReactNode
}

function PrimaryColorPicker(props: PrimaryColorPickerProps) {
  const { t } = useTranslation()

  const { color: colorProp, onColorChange, localKey, extraColors, children } = props

  const color = new TinyColor(colorProp).toHex8String()

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
      let newRecentColorsQueue = [...(recentColorsQueue || [])]
      newRecentColorsQueue.unshift(selectedColor)
      newRecentColorsQueue = uniq(newRecentColorsQueue)

      if (newRecentColorsQueue.length > 5) {
        newRecentColorsQueue.pop()
      }
      setRecentColorsQueue(newRecentColorsQueue)
    }
  }

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
      onChange={_onColorChange}
      onOpenChange={onOpenChange}
      placement='bottom'
      arrow={false}
    >
      {children}
    </ColorPicker>
  )
}

export default memo(PrimaryColorPicker)
