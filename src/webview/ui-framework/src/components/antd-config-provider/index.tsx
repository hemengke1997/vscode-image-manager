import { memo, type PropsWithChildren, useEffect } from 'react'
import { TinyColor } from '@ctrl/tinycolor'
import { theme as antdTheme, App, ConfigProvider } from 'antd'
import { MotionConfig } from 'framer-motion'
import FrameworkContext from '../../contexts/framework-context'
import { getCssVar } from '../../utils/theme'

const DURATION_BASE = 0.06

function isSameTheme(color: string, theme: Theme) {
  return (new TinyColor(color).isLight() && theme === 'light') || (new TinyColor(color).isDark() && theme === 'dark')
}

function ligherOrDarker(color: string, theme: Theme) {
  const c = new TinyColor(color)

  switch (theme) {
    case 'light':
      return c.lighten(8).toString()
    case 'dark':
      return c.darken(8).toString()
    default:
      return color
  }
}

function AntdConfigProvider({ children }: PropsWithChildren) {
  const { primaryColor, themeWithoutAuto, reduceMotionWithoutAuto } = FrameworkContext.usePicker([
    'primaryColor',
    'themeWithoutAuto',
    'reduceMotionWithoutAuto',
  ])

  const vscodeFontSize = getCssVar('--vscode-font-size').split('px')[0]
  const vscodeEditorBackground = getCssVar('--vscode-editor-background')

  const getThemeAlgorithm = () => {
    switch (themeWithoutAuto) {
      case 'dark':
        return antdTheme.darkAlgorithm
      case 'light':
        return antdTheme.defaultAlgorithm
      default:
        return antdTheme.darkAlgorithm
    }
  }

  const docFontSize = Number(vscodeFontSize) - 1 || 12

  useEffect(() => {
    document.documentElement.style.setProperty('font-size', `${docFontSize}px`)
  }, [docFontSize])

  return (
    <MotionConfig reducedMotion={reduceMotionWithoutAuto === 'on' ? 'always' : 'never'}>
      <ConfigProvider
        input={{ autoComplete: 'off' }}
        button={{
          autoInsertSpace: false,
        }}
        theme={{
          hashed: false,
          cssVar: true,
          algorithm: [getThemeAlgorithm()],
          token: {
            fontFamily: getCssVar('var(--vscode-font-family)'),
            motion: reduceMotionWithoutAuto === 'on' ? false : true,
            fontSize: docFontSize,
            colorPrimary: primaryColor,
            motionDurationSlow: `${DURATION_BASE * 2}s`,
            motionDurationMid: `${DURATION_BASE}s`,
            motionDurationFast: `${DURATION_BASE / 2}s`,
            ...(isSameTheme(vscodeEditorBackground, themeWithoutAuto) && {
              colorBgContainer: vscodeEditorBackground,
              colorBgBase: ligherOrDarker(vscodeEditorBackground, themeWithoutAuto),
            }),
          },
        }}
        componentSize='small'
        warning={{ strict: false }}
      >
        <App
          className={'bg-ant-color-bg-container'}
          message={{
            top: 70,
            maxCount: 5,
            duration: 3,
          }}
          notification={{
            showProgress: true,
            pauseOnHover: true,
          }}
        >
          {children}
        </App>
      </ConfigProvider>
    </MotionConfig>
  )
}

export default memo(AntdConfigProvider)
