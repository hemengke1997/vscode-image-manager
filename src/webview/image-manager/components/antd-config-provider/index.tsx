import { MotionConfig } from 'motion/react'
import { memo, type PropsWithChildren, useEffect } from 'react'
import { TinyColor } from '@ctrl/tinycolor'
import { theme as antdTheme, App, ConfigProvider } from 'antd'
import { Theme } from '~/enums'
import SettingsContext from '~/webview/image-manager/contexts/settings-context'
import { getCssVar } from '~/webview/image-manager/utils/theme'

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
  const { primaryColor, theme, reduceMotion } = SettingsContext.usePicker(['primaryColor', 'theme', 'reduceMotion'])

  const vscodeFontSize = getCssVar('--vscode-font-size').split('px')[0]
  const vscodeEditorBackground = getCssVar('--vscode-editor-background')

  const token = antdTheme.useToken()

  const getThemeAlgorithm = () => {
    switch (theme) {
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
    <MotionConfig reducedMotion={reduceMotion === 'on' ? 'always' : 'never'}>
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
            motion: reduceMotion === 'on' ? false : true,
            fontSize: docFontSize,
            colorPrimary: primaryColor,
            motionDurationSlow: `${DURATION_BASE * 2}s`,
            motionDurationMid: `${DURATION_BASE}s`,
            motionDurationFast: `${DURATION_BASE / 2}s`,
            ...(isSameTheme(vscodeEditorBackground, theme) && {
              colorBgContainer: vscodeEditorBackground,
              colorBgBase: ligherOrDarker(vscodeEditorBackground, theme),
            }),
            colorBgMask: new TinyColor(token.token.colorBgMask).setAlpha(theme === Theme.dark ? 0.6 : 0.85).toString(),
          },
          components: {
            Modal: {
              controlHeight: 24,
            },
          },
        }}
        componentSize='small'
        warning={{ strict: true }}
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
