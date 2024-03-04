import { useLocalStorageState } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useEffect, useState } from 'react'
import { type ConfigType, defaultConfig } from '~/core/config/common'
import { useTrackConfigState } from '~/webview/hooks/useTrackConfigState'
import { LocalStorageEnum } from '~/webview/local-storage'
import { switchTheme, vscodeColors } from '../utils/theme'

const useFrameworkContext = (initial: { theme: Theme; language: Language }) => {
  /* ------------- extension config ------------- */
  const [extConfig, setExtConfig] = useState<ConfigType>({
    ...defaultConfig,
    appearance: {
      ...defaultConfig.appearance,
      theme: initial.theme,
      language: initial.language,
    },
  })

  const [primaryColor, setPrimaryColor] = useState(vscodeColors[0])

  const [theme, setTheme] = useTrackConfigState<Theme>(extConfig.appearance.theme as Theme)

  useEffect(() => {
    if (theme) {
      switchTheme(theme as Theme)
    }
  }, [theme])

  const [mode, setMode] = useLocalStorageState<'standard' | 'simple'>(LocalStorageEnum.LOCAL_STORAGE_MODE_KEY, {
    defaultValue: 'standard',
  })

  return {
    extConfig,
    setExtConfig,
    primaryColor,
    setPrimaryColor,
    theme,
    setTheme,
    mode,
    setMode,
  }
}

const FrameworkContext = createContainer(useFrameworkContext)

export default FrameworkContext
