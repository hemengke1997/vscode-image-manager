import { useLocalStorageState } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useEffect } from 'react'
import { localStorageEnum } from '@/webview/local-storage'
import { type ThemeType, getTheme, switchTheme, vscodeColors } from '../utils/theme'

const useFrameworkContext = (initial: { theme?: Window['vscodeTheme'] }) => {
  const [primaryColor, setPrimaryColor] = useLocalStorageState(localStorageEnum.LOCAL_STORAGE_PRIMARY_COLOR_KEY, {
    defaultValue: vscodeColors[0],
  })

  const [theme, setTheme] = useLocalStorageState<ThemeType>(localStorageEnum.LOCAL_STORAGE_THEME_KEY, {
    defaultValue: initial.theme || getTheme(),
  })

  const [compact, setCompact] = useLocalStorageState(localStorageEnum.LOCAL_STORAGE_COMPACT_KEY, {
    defaultValue: false,
  })

  useEffect(() => {
    theme && switchTheme(theme)
  }, [theme])

  const [mode, setMode] = useLocalStorageState<'standard' | 'simple'>(localStorageEnum.LOCAL_STORAGE_MODE_KEY, {
    defaultValue: 'standard',
  })

  return {
    primaryColor,
    setPrimaryColor,
    theme,
    setTheme,
    compact,
    setCompact,
    mode,
    setMode,
  }
}

const FrameworkContext = createContainer(useFrameworkContext)

export default FrameworkContext
