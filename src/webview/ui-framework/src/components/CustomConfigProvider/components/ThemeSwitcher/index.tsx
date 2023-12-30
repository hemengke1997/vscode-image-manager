import { useControlledState } from '@minko-fe/react-hook'
import { Switch } from 'antd'
import { memo, startTransition } from 'react'
import { CiDark, CiLight } from 'react-icons/ci'
import { type ThemeType } from '@/utils/theme'

type ThemeSwitcherProps = {
  theme?: ThemeType
  onThemeChange?: (theme: ThemeType) => void
}

function ThemeSwitcher(props: ThemeSwitcherProps) {
  const { theme: themeProp, onThemeChange } = props

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
          setTheme(checked ? 'dark' : 'light')
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
    />
  )
}

export default memo(ThemeSwitcher)
