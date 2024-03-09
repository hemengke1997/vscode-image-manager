import { TinyColor } from '@ctrl/tinycolor'
import { App, ConfigProvider, theme as antdTheme } from 'antd'
import { type PropsWithChildren, memo } from 'react'
import FrameworkContext from '../../contexts/FrameworkContext'
import { getCssVar } from '../../utils/theme'

const DURATION_BASE = 0.06

function isSameTheme(color: string, theme: Theme) {
  return (new TinyColor(color).isLight() && theme === 'light') || (new TinyColor(color).isDark() && theme === 'dark')
}

function AntdConfigProvider({ children }: PropsWithChildren) {
  const { theme, primaryColor } = FrameworkContext.usePicker(['theme', 'primaryColor'])

  const vscodeFontSize = getCssVar('--vscode-font-size').split('px')[0]
  const vscodeEditorBackground = getCssVar('--vscode-editor-background')

  return (
    <ConfigProvider
      autoInsertSpaceInButton={false}
      input={{ autoComplete: 'off' }}
      theme={{
        hashed: false,
        cssVar: true,
        algorithm: theme === 'dark' ? [antdTheme.darkAlgorithm] : [antdTheme.defaultAlgorithm],
        token: {
          fontSize: Number(vscodeFontSize) - 1 || 12,
          colorPrimary: primaryColor,
          motionDurationSlow: `${DURATION_BASE * 2}s`,
          motionDurationMid: `${DURATION_BASE}s`,
          motionDurationFast: `${DURATION_BASE / 2}s`,
          ...(isSameTheme(vscodeEditorBackground, theme) ? { colorBgContainer: vscodeEditorBackground } : {}),
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
        notification={{}}
      >
        {children}
      </App>
    </ConfigProvider>
  )
}

export default memo(AntdConfigProvider)
