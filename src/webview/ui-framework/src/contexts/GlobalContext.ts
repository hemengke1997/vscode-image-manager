import { useLocalStorageState, useSetState } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useEffect } from 'react'
import { LOCAL_STORAGE_PRIMARY_COLOR_KEY } from '@/utils/local-storage'
import { type ThemeType, builtInColors, getTheme, switchTheme } from '@/utils/theme'

const useGlobalContext = () => {
  const [localPrimaryColor, setLocalPrimaryColor] = useLocalStorageState(LOCAL_STORAGE_PRIMARY_COLOR_KEY, {
    defaultValue: builtInColors[0].primary,
  })

  const [appearance, setAppearance] = useSetState<{
    theme: ThemeType
    primaryColor: string
  }>(() => ({
    theme: getTheme(),
    primaryColor: localPrimaryColor!,
  }))

  useEffect(() => {
    switchTheme(appearance.theme)
  }, [appearance.theme])

  useEffect(() => {
    setLocalPrimaryColor(appearance.primaryColor)
  }, [appearance.primaryColor])

  return {
    appearance,
    setAppearance,
  }
}

const GlobalContext = createContainer(useGlobalContext)

export default GlobalContext
