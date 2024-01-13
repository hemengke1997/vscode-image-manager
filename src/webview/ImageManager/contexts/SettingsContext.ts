import { TinyColor } from '@ctrl/tinycolor'
import { useLocalStorageState } from '@minko-fe/react-hook'
import { localStorageEnum } from '@rootSrc/webview/local-storage'
import FrameworkContext from '@rootSrc/webview/ui-framework/src/contexts/FrameworkContext'
import { createContainer } from 'context-state'
import { useMemo } from 'react'
import { type GroupType } from '../components/DisplayGroup'
import { type DisplayStyleType } from '../components/DisplayStyle'
import { Colors } from '../utils/color'

function useSettingsContext() {
  const { theme } = FrameworkContext.usePicker(['theme'])

  /* -------------- image display type --------------- */
  const [displayImageTypes, setDisplayImageTypes] = useLocalStorageState<string[]>(
    localStorageEnum.LOCAL_STORAGE_DISPLAY_TYPE,
    { defaultValue: [] },
  )

  /* ---------------- image sort ---------------- */
  const [sort, setSort] = useLocalStorageState<string[]>(localStorageEnum.LOCAL_STORAGE_SORT, {
    defaultValue: ['size', 'asc'],
  })

  /* ------ display style (flat | neseted) ------ */
  const [displayStyle, setDisplayStyle] = useLocalStorageState<DisplayStyleType>(
    localStorageEnum.LOCAL_STORAGE_DISPLAY_STYLE,
    {
      defaultValue: 'compact',
    },
  )

  /* ---------------- image group --------------- */
  const [_displayGroup, setDisplayGroup] = useLocalStorageState<GroupType[]>(
    localStorageEnum.LOCAL_STORAGE_DISPLAY_GROUP,
    {
      defaultValue: ['dir'],
    },
  )

  const displayGroup: GroupType[] = useMemo(() => ['workspace', ...(_displayGroup || [])], [_displayGroup])

  /* ----------- image backgroundColor ---------- */
  const [backgroundColor, setBackgroundColor] = useLocalStorageState<string>(
    localStorageEnum.LOCAL_STORAGE_BACKGROUND_COLOR_KEY,
    {
      defaultValue: theme === 'dark' ? Colors.warmWhite : Colors.warmBlack,
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
