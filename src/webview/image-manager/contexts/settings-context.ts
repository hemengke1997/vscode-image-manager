import { useMemo } from 'react'
import { TinyColor } from '@ctrl/tinycolor'
import { useMemoizedFn } from 'ahooks'
import { createContainer } from 'context-state'
import { difference } from 'lodash-es'
import { ConfigKey } from '~/core/config/common'
import { WorkspaceStateKey, type WorkspaceStateType } from '~/core/persist/workspace/common'
import { Language, ReduceMotion, Theme } from '~/enums'
import { intelligentPick } from '~/utils/intelligent-pick'
import { useExtConfigState } from '~/webview/hooks/use-ext-config-state'
import { useWorkspaceState } from '~/webview/hooks/use-workspace-state'
import { vscodeColors } from '~/webview/ui-framework/src/utils/theme'
import GlobalContext from './global-context'

function useSettingsContext() {
  const { workspaceState, extConfig, vscodeConfig, allImageTypes } = GlobalContext.usePicker([
    'workspaceState',
    'extConfig',
    'vscodeConfig',
    'allImageTypes',
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

  /* -------------- display type --------------- */
  const [_displayImageTypes, _setDisplayImageTypes] = useWorkspaceState(
    WorkspaceStateKey.display_type,
    workspaceState.display_type,
  )

  const displayImageTypes = useMemo(
    () => ({
      unchecked: _displayImageTypes?.unchecked,
      checked: difference(allImageTypes, _displayImageTypes?.unchecked),
    }),
    [_displayImageTypes.unchecked, allImageTypes],
  )

  const setDisplayImageTypes = useMemoizedFn((checked: string[]) => {
    const unchecked = difference(allImageTypes, checked)
    _setDisplayImageTypes((t) => ({
      unchecked: unchecked || t?.unchecked || [],
    }))
  })

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

  const displayGroup: WorkspaceStateType['display_group'] = useMemo(
    () => ['workspace', ...(_displayGroup || [])],
    [_displayGroup],
  )

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
    displayImageTypes,
    setDisplayImageTypes,
    backgroundColor,
    isDarkBackground,
    setBackgroundColor,
    tinyBackgroundColor,
    hoverShowImageDetail,
    setHoverShowImageDetail,
  }
}

const SettingsContext = createContainer(useSettingsContext)

export default SettingsContext
