import { memo, type PropsWithChildren, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { IoSettingsOutline } from 'react-icons/io5'
import Logo from '~root/assets/logo.svg?react'
import { useUpdateEffect } from 'ahooks'
import { Button, Tooltip } from 'antd'
import { toLower } from 'lodash-es'
import { getCssVar, setHtmlTheme } from '~/webview/image-manager/utils/theme'
import useSettings from '../../hooks/use-settings/use-settings'
import SettingsStore from '../../stores/settings-store'

function Layout(props: PropsWithChildren) {
  const { children } = props
  const { i18n } = useTranslation()

  const { theme, language } = SettingsStore.useStore(['theme', 'language'])

  const { t } = useTranslation()

  const domRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fontSize = getCssVar('--ant-font-size', domRef.current!).split('px')[0]
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [])

  // every time the theme changes, update the html theme (for tailwindcss)
  useEffect(() => {
    setHtmlTheme(theme)
  }, [theme])

  useUpdateEffect(() => {
    i18n.changeLanguage(language)
  }, [language])

  const [showSettings] = useSettings()

  return (
    <div className={'min-w-screen min-h-screen space-y-2 p-4'} ref={domRef}>
      <header className={'mb-4 flex items-center justify-between'}>
        <a href='https://github.com/hemengke1997/vscode-image-manager' target={'_blank'}>
          <Logo className='fill-ant-color-primary text-4xl' />
        </a>

        <Tooltip title={toLower(t('im.settings'))} arrow={false} placement={'bottom'}>
          <Button
            type='text'
            icon={
              <div className={'flex items-center text-2xl'}>
                <IoSettingsOutline />
              </div>
            }
            onClick={showSettings}
          ></Button>
        </Tooltip>
      </header>
      {children}
    </div>
  )
}

export default memo(Layout)
