import { TinyColor } from '@ctrl/tinycolor'
import { createContainer } from 'context-state'
import { useMemo } from 'react'
import { ConfigKey } from '~/core/config/common'
import { WorkspaceStateKey, type WorkspaceStateType } from '~/core/persist/workspace/common'
import { useExtConfigState } from '~/webview/hooks/use-ext-config-state'
import { useWorkspaceState } from '~/webview/hooks/use-workspace-state'
import GlobalContext from './global-context'

function useSettingsContext() {
  const { workspaceState } = GlobalContext.usePicker(['workspaceState'])
  /* -------------- display type --------------- */
  const [displayImageTypes, setDisplayImageTypes] = useWorkspaceState(
    WorkspaceStateKey.display_type,
    workspaceState.display_type,
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

  const displayGroup: WorkspaceStateType['display_group'] = useMemo(
    () => ['workspace', ...(_displayGroup || [])],
    [_displayGroup],
  )

  /* ----------- image backgroundColor ---------- */
  const _backgroundColor = GlobalContext.useSelector((ctx) => ctx.extConfig.viewer.imageBackgroundColor)
  const [backgroundColor, setBackgroundColor] = useExtConfigState(
    ConfigKey.viewer_imageBackgroundColor,
    _backgroundColor,
  )

  const tinyBackgroundColor = useMemo(() => new TinyColor(backgroundColor), [backgroundColor])
  const isDarkBackground = tinyBackgroundColor.isDark()

  return {
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
  }
}

const SettingsContext = createContainer(useSettingsContext)

export default SettingsContext
