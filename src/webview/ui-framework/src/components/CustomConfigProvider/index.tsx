import { lowerCase } from '@minko-fe/lodash-pro'
import { Button, Popover, Tooltip } from 'antd'
import { AnimatePresence, motion } from 'framer-motion'
import { type PropsWithChildren, memo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { IoSettingsOutline } from 'react-icons/io5'
import { ConfigKey } from '~/core/config/common'
import { useConfiguration } from '~/webview/hooks/useConfiguration'
import { LocalStorageEnum } from '~/webview/local-storage'
import Logo from '~/webview/ui-framework/src/images/logo.svg?react'
import FrameworkContext from '../../contexts/FrameworkContext'
import { getCssVar, setHtmlTheme } from '../../utils/theme'
import LocaleSelector from './components/LocaleSelector'
import PrimaryColorPicker from './components/PrimaryColorPicker'
import ThemeSelector from './components/ThemeSelector'

function CustomConfigProvider(props: PropsWithChildren) {
  const { children } = props
  const { primaryColor, theme, setPrimaryColor, setTheme, mode, setMode, themeWithoutAuto } =
    FrameworkContext.usePicker([
      'primaryColor',
      'theme',
      'setPrimaryColor',
      'setTheme',
      'mode',
      'setMode',
      'themeWithoutAuto',
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

  const { update } = useConfiguration()

  // every time the theme changes, update the html theme (for tailwindcss)
  useEffect(() => {
    setHtmlTheme(themeWithoutAuto)
  }, [themeWithoutAuto])

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
            className={'flex-center'}
            icon={<Logo className='fill-ant-color-primary text-4xl' />}
          ></Button>
        </Tooltip>
        <AnimatePresence>
          {!isSimpleMode(mode) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: '-100%' }}
              transition={{ duration: 0.15 }}
            >
              <Popover
                trigger={['click']}
                arrow={false}
                placement='left'
                content={
                  <div className={'flex-center space-x-2'}>
                    <LocaleSelector />
                    <ThemeSelector value={theme} onChange={setTheme} />
                    <PrimaryColorPicker
                      localKey={LocalStorageEnum.LOCAL_STORAGE_RECENT_COLORS_KEY}
                      value={primaryColor}
                      onChange={(color) => {
                        setPrimaryColor(color)
                        return new Promise((resolve) => {
                          update(
                            {
                              key: ConfigKey.appearance_primaryColor,
                              value: color,
                            },
                            () => {
                              resolve()
                            },
                          )
                        })
                      }}
                    ></PrimaryColorPicker>
                  </div>
                }
              >
                <Button
                  type='text'
                  icon={
                    <div className={'flex-center text-2xl'}>
                      <IoSettingsOutline />
                    </div>
                  }
                  title={lowerCase(t('im.settings'))}
                ></Button>
              </Popover>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      {children}
    </div>
  )
}

export default memo(CustomConfigProvider)
