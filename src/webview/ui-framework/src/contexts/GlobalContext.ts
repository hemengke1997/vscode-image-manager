import { useLocalStorageState, useSetState } from '@minko-fe/react-hook'
import { localStorageEnum } from '@root/webview/local-storage'
import { createContainer } from 'context-state'
import { useEffect } from 'react'
import { type ThemeType, getCssVar, getTheme, switchTheme } from '@/utils/theme'

const useGlobalContext = () => {
  const [localPrimaryColor, setLocalPrimaryColor] = useLocalStorageState(
    localStorageEnum.LOCAL_STORAGE_PRIMARY_COLOR_KEY,
    {
      defaultValue: getCssVar('--vscode-button-background'),
    },
  )

  const [localTheme, setLocalTheme] = useLocalStorageState(localStorageEnum.LOCAL_STORAGE_THEME_KEY, {
    defaultValue: getTheme(),
  })

  const [appearance, setAppearance] = useSetState<{
    theme: ThemeType
    primaryColor: string
  }>(() => ({
    theme: localTheme!,
    primaryColor: localPrimaryColor!,
  }))

  useEffect(() => {
    switchTheme(appearance.theme)
    setLocalTheme(appearance.theme)
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
