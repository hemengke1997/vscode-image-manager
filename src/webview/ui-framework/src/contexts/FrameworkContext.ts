import { useLocalStorageState, useUpdateEffect } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useEffect, useState } from 'react'
import { type ConfigType, defaultConfig } from '~/core/config/common'
import { LocalStorageEnum } from '~/webview/local-storage'
import { getTheme, switchTheme, vscodeColors } from '../utils/theme'

const useFrameworkContext = (initial: { theme?: Theme }) => {
  /* ------------- extension config ------------- */
  const [extConfig, setExtConfig] = useState<ConfigType>(defaultConfig)

  const [primaryColor, setPrimaryColor] = useState(vscodeColors[0])

  const [theme, setTheme] = useState<Theme>(initial.theme || getTheme())

  useEffect(() => {
    if (theme) {
      switchTheme(theme)
    }
  }, [theme])

  useUpdateEffect(() => {
    setTheme(extConfig.appearance.theme as Theme)
  }, [extConfig.appearance.theme])

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
