import { useMemo } from 'react'
import { TinyColor } from '@ctrl/tinycolor'
import { createContainer } from 'context-state'
import { ConfigKey } from '~/core/config/common'
import { WorkspaceStateKey } from '~/core/persist/workspace/common'
import { Language, ReduceMotion, Theme } from '~/enums'
import { intelligentPick } from '~/utils/intelligent-pick'
import { useExtConfigState } from '~/webview/hooks/use-ext-config-state'
import { useWorkspaceState } from '~/webview/hooks/use-workspace-state'
import { vscodeColors } from '../utils/theme'
import VscodeContext from './vscode-context'

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
  // 动画
  const [reduceMotion] = useExtConfigState(ConfigKey.appearance_reduceMotion, extConfig.appearance.reduceMotion)

  // theme without `auto`
  const themeWithoutAuto = useMemo(() => {
    return intelligentPick(theme, vscodeConfig.theme, Theme.auto)
  }, [theme, vscodeConfig.theme])

  // language without `auto`
  const languageWithoutAuto = useMemo(
    () => intelligentPick(language, vscodeConfig.language, Language.auto),
    [language, vscodeConfig.language],
  )

  // reduceMotion without `auto`
  const reduceMotionWithoutAuto = useMemo(
    () => intelligentPick(reduceMotion, vscodeConfig.reduceMotion, ReduceMotion.auto),
    [reduceMotion, vscodeConfig.reduceMotion],
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
    reduceMotionWithoutAuto,
  }
}

const FrameworkContext = createContainer(useFrameworkContext)

export default FrameworkContext
