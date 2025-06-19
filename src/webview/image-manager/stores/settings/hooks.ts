import { TinyColor } from '@ctrl/tinycolor'
import { useMemoizedFn } from 'ahooks'
import { uniq } from 'es-toolkit'
import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { useMemo } from 'react'
import { ConfigKey } from '~/core/config/common'
import { WorkspaceStateKey } from '~/core/persist/workspace/common'
import { Language, ReduceMotion, Theme } from '~/meta'
import { intelligentPick } from '~/utils'
import { useExtConfigState } from '../../hooks/use-ext-config-state'
import { useWorkspaceState } from '../../hooks/use-workspace-state'
import { VscodeAtoms } from '../../stores/vscode/vscode-store'
import { vscodeColors } from '../../utils/theme'

/**
 * 主题色
 */
export function usePrimaryColor() {
  const _primaryColor = useAtomValue(
    selectAtom(
      VscodeAtoms.extConfigAtom,
      useMemoizedFn(state => state.appearance.primaryColor),
    ),
  )

  const [primaryColor, setPrimaryColor] = useExtConfigState(ConfigKey.appearance_primaryColor, _primaryColor, [], {
    debounce: {
      wait: 500,
    },
  })

  return [
    useMemo(() => {
      if (new TinyColor(primaryColor).isValid) {
        return primaryColor
      }
      return vscodeColors[0]
    }, [primaryColor]),
    setPrimaryColor,
  ] as const
}

// 源主题模式
export function useOriginTheme() {
  const _originTheme = useAtomValue(
    selectAtom(
      VscodeAtoms.extConfigAtom,
      useMemoizedFn(state => state.appearance.theme),
    ),
  )

  const [originTheme, setOriginTheme] = useExtConfigState(ConfigKey.appearance_theme, _originTheme)

  return [originTheme, setOriginTheme] as const
}

// 主题模式
export function useTheme() {
  const theme = useAtomValue(
    selectAtom(
      VscodeAtoms.vscodeConfigAtom,
      useMemoizedFn(state => state.theme),
    ),
  )
  const [originTheme] = useOriginTheme()
  return [
    useMemo(() => {
      return intelligentPick(originTheme, theme, Theme.auto)
    }, [originTheme, theme]),
  ] as const
}

// 源语言
export function useOriginLanguage() {
  const _originLanguage = useAtomValue(
    selectAtom(
      VscodeAtoms.extConfigAtom,
      useMemoizedFn(state => state.appearance.language),
    ),
  )
  const [originLanguage, setOriginLanguage] = useExtConfigState(ConfigKey.appearance_language, _originLanguage)

  return [originLanguage, setOriginLanguage] as const
}

// 语言
export function useLanguage() {
  const language = useAtomValue(
    selectAtom(
      VscodeAtoms.vscodeConfigAtom,
      useMemoizedFn(state => state.language),
    ),
  )
  const [originLanguage] = useOriginLanguage()
  return useMemo(() => intelligentPick(originLanguage, language, Language.auto), [originLanguage, language])
}

// 源动画
export function useOriginReduceMotion() {
  const originReduceMotion = useAtomValue(
    selectAtom(
      VscodeAtoms.extConfigAtom,
      useMemoizedFn(state => state.appearance.reduceMotion),
    ),
  )
  return [originReduceMotion] as const
}
// 动画
export function useReduceMotion() {
  const [originReduceMotion] = useOriginReduceMotion()
  const reduceMotion = useAtomValue(
    selectAtom(
      VscodeAtoms.vscodeConfigAtom,
      useMemoizedFn(state => state.reduceMotion),
    ),
  )
  return useMemo(
    () => intelligentPick(originReduceMotion, reduceMotion, ReduceMotion.auto),
    [originReduceMotion, reduceMotion],
  )
}

// display sort
export function useSort() {
  const _displaySort = useAtomValue(
    selectAtom(
      VscodeAtoms.workspaceStateAtom,
      useMemoizedFn(state => state.display_sort),
    ),
  )
  const [displaySort, setDisplaySort] = useWorkspaceState(WorkspaceStateKey.display_sort, _displaySort)
  return [displaySort, setDisplaySort] as const
}

// display style
export function useDisplayStyle() {
  const _displayStyle = useAtomValue(
    selectAtom(
      VscodeAtoms.workspaceStateAtom,
      useMemoizedFn(state => state.display_style),
    ),
  )
  const [displayStyle, setDisplayStyle] = useWorkspaceState(WorkspaceStateKey.display_style, _displayStyle)
  return [displayStyle, setDisplayStyle] as const
}

// display group
export function useDisplayGroup() {
  const _displayGroup = useAtomValue(
    selectAtom(
      VscodeAtoms.workspaceStateAtom,
      useMemoizedFn(state => state.display_group),
    ),
  )
  const [displayGroup, setDisplayGroup] = useWorkspaceState(WorkspaceStateKey.display_group, _displayGroup)
  return [useMemo(() => uniq(displayGroup || []), [displayGroup]), setDisplayGroup] as const
}

// image backgroundColor
export function useImageBackgroundColor() {
  const _imageBackgroundColor = useAtomValue(
    selectAtom(
      VscodeAtoms.extConfigAtom,
      useMemoizedFn(state => state.viewer.imageBackgroundColor),
    ),
  )
  const [imageBackgroundColor, setImageBackgroundColor] = useExtConfigState(
    ConfigKey.viewer_imageBackgroundColor,
    _imageBackgroundColor,
  )
  return [imageBackgroundColor, setImageBackgroundColor] as const
}

// tiny background color
export function useTinyBackgroundColor() {
  const [imageBackgroundColor] = useImageBackgroundColor()
  return [useMemo(() => new TinyColor(imageBackgroundColor), [imageBackgroundColor])] as const
}

// is dark background
export function useIsDarkBackground() {
  const [tinyBackgroundColor] = useTinyBackgroundColor()
  return [useMemo(() => tinyBackgroundColor.isDark(), [tinyBackgroundColor])] as const
}

// hover show image detail
export function useHoverShowImageDetail() {
  const _hoverShowImageDetail = useAtomValue(
    selectAtom(
      VscodeAtoms.extConfigAtom,
      useMemoizedFn(state => state.viewer.showDetailsOnHover),
    ),
  )
  const [hoverShowImageDetail, setHoverShowImageDetail] = useExtConfigState(
    ConfigKey.viewer_showDetailsOnHover,
    _hoverShowImageDetail,
  )
  return [hoverShowImageDetail, setHoverShowImageDetail] as const
}
