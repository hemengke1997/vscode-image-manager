import { useControlledState } from 'ahooks-x'
import { Button, Dropdown } from 'antd'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md'
import { VscColorMode } from 'react-icons/vsc'

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
      label: <MdOutlineLightMode className={'text-2xl'} />,
    },
    {
      key: 'dark',
      label: <MdOutlineDarkMode className={'text-2xl'} />,
    },
    {
      key: 'auto',
      label: <VscColorMode className={'text-2xl'} />,
    },
  ]

  const [theme, setTheme] = useControlledState({
    defaultValue: value,
    value,
    onChange,
  })

  return (
    <Dropdown
      menu={{
        items: themes,
        selectable: true,
        selectedKeys: [theme],
        onSelect(info) {
          setTheme(info.key as Theme)
        },
      }}
      trigger={['click']}
      placement='bottom'
    >
      <Button
        icon={<div className={'flex items-center text-2xl'}>{themes.find((t) => t!.key === theme)?.label}</div>}
        type='text'
        title={t('im.theme')}
      ></Button>
    </Dropdown>
  )
}

export default memo(ThemeSelector)
