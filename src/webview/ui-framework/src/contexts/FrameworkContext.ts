import { TinyColor } from '@ctrl/tinycolor'
import { useLocalStorageState } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useMemo, useState } from 'react'
import { type ConfigType, type VscodeConfigType } from '~/core/config/common'
import { useTrackConfigState } from '~/webview/hooks/useTrackConfigState'
import { LocalStorageEnum } from '~/webview/local-storage'
import { weightByKey } from '~/webview/utils'
import { vscodeColors } from '../utils/theme'

const useFrameworkContext = (initial: { extConfig: ConfigType; vscodeConfig: VscodeConfigType }) => {
  /* ------------- extension config ------------- */
  // !!! Don't invoke `setExtConfig` to update `extConfig` directly
  const [extConfig, setExtConfig] = useState<ConfigType>(initial.extConfig)

  const [vscodeConfig, setVscodeConfig] = useState<VscodeConfigType>(initial.vscodeConfig)

  const [primaryColor, setPrimaryColor] = useTrackConfigState(() => {
    const primaryColor = extConfig.appearance.primaryColor
    if (new TinyColor(primaryColor).isValid) {
      return primaryColor
    }
    return vscodeColors[0]
  }, [extConfig.appearance.primaryColor])

  const [theme, setTheme] = useTrackConfigState<Theme>(extConfig.appearance.theme)
  const [language, setLanguage] = useTrackConfigState<Language>(extConfig.appearance.language)

  // theme without `auto`
  const themeWithoutAuto = useMemo(() => weightByKey(theme, vscodeConfig.theme, 'auto'), [theme, vscodeConfig.theme])

  // language without `auto`
  const languageWithoutAuto = useMemo(
    () => weightByKey(language, vscodeConfig.language, 'auto'),
    [language, vscodeConfig.language],
  )

  const [mode, setMode] = useLocalStorageState<'standard' | 'simple'>(LocalStorageEnum.LOCAL_STORAGE_MODE_KEY, {
    defaultValue: 'standard',
  })

  return {
    extConfig,
    setExtConfig,
    vscodeConfig,
    setVscodeConfig,
    language,
    setLanguage,
    primaryColor,
    setPrimaryColor,
    theme,
    setTheme,
    mode,
    setMode,
    themeWithoutAuto,
    languageWithoutAuto,
  }
}

const FrameworkContext = createContainer(useFrameworkContext)

export default FrameworkContext
