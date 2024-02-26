import { useLocalStorageState } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useEffect } from 'react'
import { LocalStorageEnum } from '~/webview/local-storage'
import { getTheme, switchTheme, vscodeColors } from '../utils/theme'

const useFrameworkContext = (initial: { theme?: Theme }) => {
  const [primaryColor, setPrimaryColor] = useLocalStorageState(LocalStorageEnum.LOCAL_STORAGE_PRIMARY_COLOR_KEY, {
    defaultValue: vscodeColors[0],
  })

  const [theme, setTheme] = useLocalStorageState<Theme>(LocalStorageEnum.LOCAL_STORAGE_THEME_KEY, {
    defaultValue: initial.theme || getTheme(),
  })

  const [compact, setCompact] = useLocalStorageState(LocalStorageEnum.LOCAL_STORAGE_COMPACT_KEY, {
    defaultValue: false,
  })

  useEffect(() => {
    theme && switchTheme(theme)
  }, [theme])

  const [mode, setMode] = useLocalStorageState<'standard' | 'simple'>(LocalStorageEnum.LOCAL_STORAGE_MODE_KEY, {
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
