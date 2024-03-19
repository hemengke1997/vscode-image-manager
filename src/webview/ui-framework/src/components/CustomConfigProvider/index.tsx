import { lowerCase } from '@minko-fe/lodash-pro'
import { useUpdateEffect } from '@minko-fe/react-hook'
import { Button, Popover, Tooltip } from 'antd'
import { motion } from 'framer-motion'
import { type PropsWithChildren, memo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { IoSettingsOutline } from 'react-icons/io5'
import { WorkspaceStateKey } from '~/core/persist/workspace/common'
import { useWorkspaceState } from '~/webview/hooks/useWorkspaceState'
import Logo from '~/webview/ui-framework/src/images/logo.svg?react'
import FrameworkContext from '../../contexts/FrameworkContext'
import { getCssVar, setHtmlTheme } from '../../utils/theme'
import LocaleSelector from './components/LocaleSelector'
import PrimaryColorPicker from './components/PrimaryColorPicker'
import ThemeSelector from './components/ThemeSelector'

function CustomConfigProvider(props: PropsWithChildren) {
  const { children } = props
  const { i18n } = useTranslation()
  const {
    primaryColor,
    theme,
    setPrimaryColor,
    setTheme,
    mode,
    setMode,
    themeWithoutAuto,
    languageWithoutAuto,
    setLanguage,
    workspaceState,
  } = FrameworkContext.usePicker([
    'primaryColor',
    'theme',
    'setPrimaryColor',
    'setTheme',
    'mode',
    'setMode',
    'themeWithoutAuto',
    'languageWithoutAuto',
    'setLanguage',
    'workspaceState',
  ])

  const { t } = useTranslation()

  const isSimpleMode = (m: string | undefined) => {
    return m === 'simple'
  }

  const domRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fontSize = getCssVar('--ant-font-size', domRef.current!).split('px')[0]
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [])

  // every time the theme changes, update the html theme (for tailwindcss)
  useEffect(() => {
    setHtmlTheme(themeWithoutAuto)
  }, [themeWithoutAuto])

  useUpdateEffect(() => {
    i18n.changeLanguage(languageWithoutAuto)
  }, [languageWithoutAuto])

  const [recentBackgroundColors, setRencentBackgroundColors] = useWorkspaceState(
    WorkspaceStateKey.rencent_layout_backgroundColor,
    workspaceState.rencent_layout_backgroundColor,
  )

  return (
    <div className={'min-w-screen min-h-screen space-y-2 p-4'} ref={domRef}>
      <header className={'flex items-center justify-between'}>
        <Tooltip
          title={isSimpleMode(mode) ? t('im.standard_mode') : t('im.simple_mode')}
          arrow={false}
          placement='right'
        >
          <Button
            onClick={() => setMode((t) => (isSimpleMode(t) ? 'standard' : 'simple'))}
            size='large'
            type='link'
            className={'flex items-center'}
            icon={<Logo className='fill-ant-color-primary text-4xl' />}
          ></Button>
        </Tooltip>
        <motion.div
          initial={{ opacity: 0 }}
          animate={!isSimpleMode(mode) ? { opacity: 1 } : { opacity: 0, y: '-100%' }}
          transition={{ duration: 0.15 }}
        >
          <Popover
            trigger={['click']}
            placement='left'
            content={
              <div className={'flex items-center space-x-2'}>
                <LocaleSelector value={languageWithoutAuto} onChange={setLanguage} />
                <ThemeSelector value={theme} onChange={setTheme} />
                <PrimaryColorPicker
                  value={primaryColor}
                  onChange={setPrimaryColor}
                  rencentColors={recentBackgroundColors}
                  onRencentColorsChange={setRencentBackgroundColors}
                ></PrimaryColorPicker>
              </div>
            }
          >
            <Button
              type='text'
              icon={
                <div className={'flex items-center text-2xl'}>
                  <IoSettingsOutline />
                </div>
              }
              title={lowerCase(t('im.settings'))}
            ></Button>
          </Popover>
        </motion.div>
      </header>
      {children}
    </div>
  )
}

export default memo(CustomConfigProvider)
