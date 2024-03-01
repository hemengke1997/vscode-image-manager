import { useControlledState } from '@minko-fe/react-hook'
import { Switch } from 'antd'
import { memo, startTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { CiDark, CiLight } from 'react-icons/ci'
import { ConfigKey } from '~/core/config/common'
import { useConfiguration } from '~/webview/hooks/useConfiguration'

type ThemeSwitcherProps = {
  theme?: Theme
  onThemeChange?: (theme: Theme) => void
}

function ThemeSwitcher(props: ThemeSwitcherProps) {
  const { theme: themeProp, onThemeChange } = props

  const { t } = useTranslation()

  const { update } = useConfiguration()

  const [theme, setTheme] = useControlledState({
    defaultValue: themeProp,
    value: themeProp,
    onChange: onThemeChange,
  })

  const checked = theme === 'dark'

  return (
    <Switch
      onChange={(checked) => {
        startTransition(() => {
          const theme = checked ? 'dark' : 'light'
          setTheme(theme)
          update({ key: ConfigKey.appearance_theme, value: theme })
        })
      }}
      checked={checked}
      checkedChildren={
        <span className={'align-middle'}>
          <CiDark />
        </span>
      }
      unCheckedChildren={
        <span className={'text-black'}>
          <CiLight />
        </span>
      }
      title={t('im.theme')}
    />
  )
}

export default memo(ThemeSwitcher)
