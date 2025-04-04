import { useMemo } from 'react'
import { TinyColor } from '@ctrl/tinycolor'
import { createStore } from 'context-state'
import { uniq } from 'es-toolkit'
import { ConfigKey } from '~/core/config/common'
import { type DisplayGroupType, WorkspaceStateKey } from '~/core/persist/workspace/common'
import { Language, ReduceMotion, Theme } from '~/enums'
import { intelligentPick } from '~/utils/intelligent-pick'
import { useExtConfigState } from '~/webview/image-manager/hooks/use-ext-config-state'
import { useWorkspaceState } from '~/webview/image-manager/hooks/use-workspace-state'
import { vscodeColors } from '~/webview/image-manager/utils/theme'
import GlobalStore from './global-store'

function useSettingsStore() {
  const { workspaceState, extConfig, vscodeConfig } = GlobalStore.useStore([
    'workspaceState',
    'extConfig',
    'vscodeConfig',
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

  // 主题
  const [originTheme, setTheme] = useExtConfigState(ConfigKey.appearance_theme, extConfig.appearance.theme)
  // 语言
  const [originLanguage, setLanguage] = useExtConfigState(ConfigKey.appearance_language, extConfig.appearance.language)
  // 动画
  const [originReduceMotion, setReduceMotion] = useExtConfigState(
    ConfigKey.appearance_reduceMotion,
    extConfig.appearance.reduceMotion,
  )

  const theme = useMemo(() => {
    return intelligentPick(originTheme, vscodeConfig.theme, Theme.auto)
  }, [originTheme, vscodeConfig.theme])

  const language = useMemo(
    () => intelligentPick(originLanguage, vscodeConfig.language, Language.auto),
    [originLanguage, vscodeConfig.language],
  )

  const reduceMotion = useMemo(
    () => intelligentPick(originReduceMotion, vscodeConfig.reduceMotion, ReduceMotion.auto),
    [originReduceMotion, vscodeConfig.reduceMotion],
  )

  /* ---------------- display sort ---------------- */
  const [sort, setSort] = useWorkspaceState(WorkspaceStateKey.display_sort, workspaceState.display_sort)

  /* --------------- display style -------------- */
  const [displayStyle, setDisplayStyle] = useWorkspaceState(
    WorkspaceStateKey.display_style,
    workspaceState.display_style,
  )

  /* ---------------- image group --------------- */
  const [_displayGroup, setDisplayGroup] = useWorkspaceState(
    WorkspaceStateKey.display_group,
    workspaceState.display_group,
  )

  const displayGroup: DisplayGroupType[] = useMemo(() => uniq([...(_displayGroup || [])]), [_displayGroup])

  /* ----------- image backgroundColor ---------- */
  const [backgroundColor, setBackgroundColor] = useExtConfigState(
    ConfigKey.viewer_imageBackgroundColor,
    extConfig.viewer.imageBackgroundColor,
  )

  const tinyBackgroundColor = useMemo(() => new TinyColor(backgroundColor), [backgroundColor])
  const isDarkBackground = tinyBackgroundColor.isDark()

  /* ---------- hover show image detail --------- */
  const [hoverShowImageDetail, setHoverShowImageDetail] = useExtConfigState(
    ConfigKey.viewer_showDetailsOnHover,
    extConfig.viewer.showDetailsOnHover,
  )

  return {
    primaryColor,
    setPrimaryColor,
    originTheme,
    theme,
    setTheme,
    reduceMotion,
    setReduceMotion,
    language,
    setLanguage,
    sort,
    setSort,
    displayStyle,
    setDisplayStyle,
    displayGroup,
    setDisplayGroup,
    backgroundColor,
    isDarkBackground,
    setBackgroundColor,
    tinyBackgroundColor,
    hoverShowImageDetail,
    setHoverShowImageDetail,
  }
}

const SettingsStore = createStore(useSettingsStore)

export default SettingsStore
