import { TinyColor } from '@ctrl/tinycolor'
import { App, ConfigProvider, theme as antdTheme } from 'antd'
import { type PropsWithChildren, memo } from 'react'
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

  return (
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
          fontFamily: 'var(--vscode-font-family)',
          motion: reduceMotionWithoutAuto === 'on' ? false : true,
          fontSize: Number(vscodeFontSize) - 1 || 12,
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
          maxCount: 3,
        }}
        notification={{
          showProgress: true,
          pauseOnHover: true,
        }}
      >
        {children}
      </App>
    </ConfigProvider>
  )
}

export default memo(AntdConfigProvider)
