import { useLocalStorageState } from '@minko-fe/react-hook'
import { localStorageEnum } from '@rootSrc/webview/local-storage'
import { createContainer } from 'context-state'
import { useEffect } from 'react'
import { type ThemeType, getTheme, switchTheme, vscodeColors } from '@/utils/theme'

const useGlobalContext = (initial: { theme?: Window['vscodeTheme'] }) => {
  const [primaryColor, setPrimaryColor] = useLocalStorageState(localStorageEnum.LOCAL_STORAGE_PRIMARY_COLOR_KEY, {
    defaultValue: vscodeColors[0],
  })

  const [theme, setTheme] = useLocalStorageState<ThemeType>(localStorageEnum.LOCAL_STORAGE_THEME_KEY, {
    defaultValue: initial.theme || getTheme(),
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
    mode,
    setMode,
  }
}

const GlobalContext = createContainer(useGlobalContext)

export default GlobalContext
