import { TinyColor } from '@ctrl/tinycolor'
import { useMemoizedFn } from 'ahooks'
import { ColorPicker, type ColorPickerProps } from 'antd'
import { uniq } from 'es-toolkit'
import { type ForwardedRef, forwardRef, memo, type ReactNode, useEffect, useImperativeHandle, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useControlledState } from '~/webview/image-manager/hooks/use-controlled-state'
import { builtInColors, vscodeColors } from '~/webview/image-manager/utils/theme'

interface Props {
  value?: string
  onChange?: (color: string) => void
  extraColors?: string[]
  children?: ReactNode
  recentColors: string[]
  onRecentColorsChange: (colors: string[]) => void
  colorPickerProps?: ColorPickerProps
}

export interface PrimaryColorPickerRef {
  updateRecentColors: (color: string) => void
}

function PrimaryColorPicker(props: Props, ref: ForwardedRef<PrimaryColorPickerRef>) {
  const { t } = useTranslation()

  const { value, onChange, extraColors, recentColors, onRecentColorsChange, colorPickerProps } = props

  const color = useMemo(() => new TinyColor(value).toHex8String(), [value])

  const [recentColorsQueue, setRecentColorsQueue] = useControlledState<string[]>({
    value: recentColors,
    onChange: onRecentColorsChange,
  })

  useEffect(() => {
    if (!recentColorsQueue.length) {
      setRecentColorsQueue([color])
    }
  }, [recentColorsQueue])

  const updateRecentColors = useMemoizedFn((color: string) => {
    if (color === recentColorsQueue?.[0])
      return
    let newRecentColorsQueue = [...(recentColorsQueue || [])]
    newRecentColorsQueue.unshift(color)
    newRecentColorsQueue = uniq(newRecentColorsQueue)

    if (newRecentColorsQueue.length > 5) {
      newRecentColorsQueue.pop()
    }

    setRecentColorsQueue(newRecentColorsQueue)
  })

  useImperativeHandle(ref, () => ({
    updateRecentColors,
  }))

  const formattedExtraColors = useMemo(() => extraColors?.map(t => new TinyColor(t).toHexString()), [extraColors])

  const [selectedColor, setSelectedColor] = useControlledState({
    defaultValue: color,
    value: color,
    onChange,
  })

  const onColorChange: ColorPickerProps['onChangeComplete'] = useMemoizedFn((color) => {
    setSelectedColor(color.toHexString())
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
          colors: uniq([...(formattedExtraColors || []), ...builtInColors.map(t => t.primary)]),
        },
        {
          label: t('im.recent'),
          colors: uniq(recentColorsQueue || []),
        },
      ]}
      value={selectedColor}
      onChangeComplete={onColorChange}
      placement='right'
      showText={true}
      {...colorPickerProps}
    >
    </ColorPicker>
  )
}

export default memo(forwardRef(PrimaryColorPicker))
