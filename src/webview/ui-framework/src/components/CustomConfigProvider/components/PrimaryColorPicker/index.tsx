import { TinyColor } from '@ctrl/tinycolor'
import { uniq } from '@minko-fe/lodash-pro'
import { useControlledState, useLocalStorageState } from '@minko-fe/react-hook'
import { Button, ColorPicker, type ColorPickerProps } from 'antd'
import { type ReactNode, memo, startTransition, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MdOutlineColorLens } from 'react-icons/md'
import { builtInColors, vscodeColors } from '~/webview/ui-framework/src/utils/theme'

type PrimaryColorPickerProps = {
  value?: string
  onChange: (color: string) => Promise<void>
  localKey: string
  extraColors?: string[]
  children?: ReactNode
}

function PrimaryColorPicker(props: PrimaryColorPickerProps) {
  const { t } = useTranslation()

  const { value, onChange, localKey, extraColors } = props

  const color = new TinyColor(value).toHex8String()

  const formattedExtraColors = extraColors?.map((t) => new TinyColor(t).toHexString())

  const [selectedColor, setSelectedColor] = useControlledState({
    defaultValue: color,
    value: color,
    onChange: async (v) => {
      setLoading(true)
      try {
        await onChange(v)
      } finally {
        setLoading(false)
      }
    },
  })

  const [recentColorsQueue, setRecentColorsQueue] = useLocalStorageState<string[]>(localKey, {
    defaultValue: [color || ''],
  })

  const [loading, setLoading] = useState(false)

  const _onColorChange: ColorPickerProps['onChange'] = (color) => {
    if (loading) return
    startTransition(() => setSelectedColor(color.toHexString()))
  }

  const onOpenChange: ColorPickerProps['onOpenChange'] = () => {
    if (selectedColor === recentColorsQueue?.[0]) return
    let newRecentColorsQueue = [...(recentColorsQueue || [])]
    newRecentColorsQueue.unshift(selectedColor)
    newRecentColorsQueue = uniq(newRecentColorsQueue)

    if (newRecentColorsQueue.length > 5) {
      newRecentColorsQueue.pop()
    }
    setRecentColorsQueue(newRecentColorsQueue)
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
      <Button
        title={t('im.primary_color')}
        type='text'
        icon={
          <div className={'flex-center text-2xl'}>
            <MdOutlineColorLens />
          </div>
        }
        loading={loading}
      ></Button>
    </ColorPicker>
  )
}

export default memo(PrimaryColorPicker)
