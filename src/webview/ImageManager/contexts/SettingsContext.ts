import { TinyColor } from '@ctrl/tinycolor'
import { useLocalStorageState } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useMemo } from 'react'
import { LocalStorageEnum } from '~/webview/local-storage'
import { type GroupType } from '../components/DisplayGroup'
import { type DisplayStyleType } from '../components/DisplayStyle'
import { Colors } from '../utils/color'

function useSettingsContext() {
  /* -------------- image display type --------------- */
  const [displayImageTypes, setDisplayImageTypes] = useLocalStorageState<{
    checked: string[]
    unchecked: string[]
  }>(LocalStorageEnum.LOCAL_STORAGE_DISPLAY_TYPE, {
    defaultValue: {
      checked: [],
      unchecked: [],
    },
  })

  /* ---------------- image sort ---------------- */
  const [sort, setSort] = useLocalStorageState<string[]>(LocalStorageEnum.LOCAL_STORAGE_SORT, {
    defaultValue: ['size', 'asc'],
  })

  /* ------ display style (flat | neseted) ------ */
  const [displayStyle, setDisplayStyle] = useLocalStorageState<DisplayStyleType>(
    LocalStorageEnum.LOCAL_STORAGE_DISPLAY_STYLE,
    {
      defaultValue: 'compact',
    },
  )

  /* ---------------- image group --------------- */
  const [_displayGroup, setDisplayGroup] = useLocalStorageState<GroupType[]>(
    LocalStorageEnum.LOCAL_STORAGE_DISPLAY_GROUP,
    {
      defaultValue: ['dir'],
    },
  )

  const displayGroup: GroupType[] = useMemo(() => ['workspace', ...(_displayGroup || [])], [_displayGroup])

  /* ----------- image backgroundColor ---------- */
  const [backgroundColor, setBackgroundColor] = useLocalStorageState<string>(
    LocalStorageEnum.LOCAL_STORAGE_BACKGROUND_COLOR_KEY,
    {
      defaultValue: Colors.warmBlack,
    },
  )

  const tinyBackgroundColor = new TinyColor(backgroundColor)
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
