import { useLocalStorageState } from '@minko-fe/react-hook'
import { localStorageEnum } from '@rootSrc/webview/local-storage'
import { createContainer } from 'context-state'
import { useMemo } from 'react'
import { type GroupType } from '../components/DisplayGroup'
import { type DisplayStyleType } from '../components/DisplayStyle'

function useSettingsContext() {
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

  return {
    sort,
    setSort,
    displayStyle,
    setDisplayStyle,
    displayGroup,
    setDisplayGroup,
    displayImageTypes,
    setDisplayImageTypes,
  }
}

const SettingsContext = createContainer(useSettingsContext)

export default SettingsContext
