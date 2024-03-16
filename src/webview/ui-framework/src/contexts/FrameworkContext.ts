import { TinyColor } from '@ctrl/tinycolor'
import { createContainer } from 'context-state'
import { useMemo } from 'react'
import { ConfigKey } from '~/core/config/common'
import { WorkspaceStateKey } from '~/core/persist/workspace/common'
import { useExtConfigState } from '~/webview/hooks/useExtConfigState'
import { useWorkspaceState } from '~/webview/hooks/useWorkspaceState'
import { weightByKey } from '~/webview/utils'
import { vscodeColors } from '../utils/theme'
import VscodeContext from './VscodeContext'

const useFrameworkContext = () => {
  const { extConfig, vscodeConfig, workspaceState } = VscodeContext.usePicker([
    'extConfig',
    'vscodeConfig',
    'workspaceState',
  ])

  // 主题色
  const [_primaryColor, setPrimaryColor] = useExtConfigState(
    ConfigKey.appearance_primaryColor,
    extConfig.appearance.primaryColor,
  )
  const primaryColor = useMemo(() => {
    if (new TinyColor(_primaryColor).isValid) {
      return _primaryColor
    }
    return vscodeColors[0]
  }, [_primaryColor])

  // 暗黑主题
  const [theme, setTheme] = useExtConfigState(ConfigKey.appearance_theme, extConfig.appearance.theme)
  // 语言
  const [language, setLanguage] = useExtConfigState(ConfigKey.appearance_language, extConfig.appearance.language)

  // theme without `auto`
  const themeWithoutAuto = useMemo(() => weightByKey(theme, vscodeConfig.theme, 'auto'), [theme, vscodeConfig.theme])

  // language without `auto`
  const languageWithoutAuto = useMemo(
    () => weightByKey(language, vscodeConfig.language, 'auto'),
    [language, vscodeConfig.language],
  )

  // 清爽模式/标准模式
  const [mode, setMode] = useWorkspaceState(WorkspaceStateKey.viewer_mode, workspaceState.viewer_mode)

  return {
    extConfig,
    vscodeConfig,
    workspaceState,
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
