import { localStorageEnum } from '@root/webview/local-storage'
import { type PropsWithChildren, memo } from 'react'
import GlobalContext from '@/contexts/GlobalContext'
import { ReactComponent as Logo } from '@/images/logo.svg'
import LocaleSelector from './components/LocaleSelector'
import PrimaryColorPicker from './components/PrimaryColorPicker'
import ThemeSwitcher from './components/ThemeSwitcher'

function CustomConfigProvider(props: PropsWithChildren) {
  const { children } = props
  const { appearance, setAppearance } = GlobalContext.usePicker(['appearance', 'setAppearance'])

  return (
    <div className={'min-w-screen min-h-screen space-y-2 p-4'}>
      <header className={'flex justify-between'}>
        <a href='https://github.com/hemengke1997/vscode-image-manager'>
          <Logo className='fill-ant-color-primary text-5xl' />
        </a>
        <div className={'flex-center space-x-2'}>
          <LocaleSelector />
          <ThemeSwitcher theme={appearance.theme} onThemeChange={(t) => setAppearance({ theme: t })} />
          <PrimaryColorPicker
            localKey={localStorageEnum.LOCAL_STORAGE_RECENT_COLORS_KEY}
            color={appearance.primaryColor}
            onColorChange={(color) =>
              setAppearance({
                primaryColor: color,
              })
            }
          />
        </div>
      </header>
      {children}
    </div>
  )
}

export default memo(CustomConfigProvider)
