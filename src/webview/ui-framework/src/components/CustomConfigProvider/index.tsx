import { localStorageEnum } from '@rootSrc/webview/local-storage'
import { Button, Tooltip } from 'antd'
import { AnimatePresence, motion } from 'framer-motion'
import { type PropsWithChildren, memo } from 'react'
import { useTranslation } from 'react-i18next'
import FrameworkContext from '@/contexts/FrameworkContext'
import { ReactComponent as Logo } from '@/images/logo.svg'
import LocaleSelector from './components/LocaleSelector'
import PrimaryColorPicker from './components/PrimaryColorPicker'
import ThemeSwitcher from './components/ThemeSwitcher'

function CustomConfigProvider(props: PropsWithChildren) {
  const { children } = props
  const { primaryColor, theme, setPrimaryColor, setTheme, mode, setMode } = FrameworkContext.usePicker([
    'primaryColor',
    'theme',
    'setPrimaryColor',
    'setTheme',
    'mode',
    'setMode',
  ])

  const { t } = useTranslation()

  const isSimpleMode = (m: string | undefined) => {
    return m === 'simple'
  }

  return (
    <div className={'min-w-screen min-h-screen space-y-2 p-4'}>
      <header className={'flex justify-between'}>
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
              className={'flex-center space-x-2'}
            >
              <LocaleSelector />
              <ThemeSwitcher theme={theme} onThemeChange={setTheme} />
              <PrimaryColorPicker
                localKey={localStorageEnum.LOCAL_STORAGE_RECENT_COLORS_KEY}
                color={primaryColor}
                onColorChange={setPrimaryColor}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      {children}
    </div>
  )
}

export default memo(CustomConfigProvider)
