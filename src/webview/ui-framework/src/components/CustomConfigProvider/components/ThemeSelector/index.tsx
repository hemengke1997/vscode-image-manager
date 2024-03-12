import { useControlledState } from '@minko-fe/react-hook'
import { Button, Dropdown } from 'antd'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md'
import { VscColorMode } from 'react-icons/vsc'
import { ConfigKey } from '~/core/config/common'
import { useConfiguration } from '~/webview/hooks/useConfiguration'

type ThemeSelectorProps = {
  value?: Theme
  onChange?: (theme: Theme) => void
}

function ThemeSelector(props: ThemeSelectorProps) {
  const { value, onChange } = props

  const { t } = useTranslation()

  const themes = [
    {
      key: 'light',
      label: <MdOutlineLightMode title='light' />,
    },
    {
      key: 'dark',
      label: <MdOutlineDarkMode title='dark' />,
    },
    {
      key: 'auto',
      label: <VscColorMode title='auto' />,
    },
  ]

  const { update } = useConfiguration()

  const [theme, setTheme] = useControlledState({
    defaultValue: value,
    value,
    onChange,
  })

  const [loading, setLoading] = useState(false)

  return (
    <Dropdown
      menu={{
        items: themes,
        selectable: true,
        selectedKeys: [theme!],
        onSelect(info) {
          if (loading) return
          setLoading(true)
          const theme = info.key as Theme

          update({ key: ConfigKey.appearance_theme, value: theme }, () => {
            setTheme(theme)
            setLoading(false)
          })
        },
      }}
      trigger={['click']}
      placement='bottom'
    >
      <Button
        icon={<div className={'flex-center text-2xl'}>{themes.find((t) => t!.key === theme)!.label}</div>}
        type='text'
        title={t('im.theme')}
        loading={loading}
      ></Button>
    </Dropdown>
  )
}

export default memo(ThemeSelector)
