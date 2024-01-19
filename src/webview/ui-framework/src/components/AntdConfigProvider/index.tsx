import { App, ConfigProvider, theme as antdTheme } from 'antd'
import { type FC, type PropsWithChildren } from 'react'
import FrameworkContext from '../../contexts/FrameworkContext'
import { getCssVar } from '../../utils/theme'

const AntdConfigProvider: FC<PropsWithChildren> = ({ children }) => {
  const { theme, primaryColor, compact } = FrameworkContext.usePicker(['theme', 'primaryColor', 'compact'])

  const vscodeFontSize = getCssVar('--vscode-font-size').split('px')[0]

  const compactAlgorithm = compact ? [antdTheme.compactAlgorithm] : []

  return (
    <ConfigProvider
      autoInsertSpaceInButton={false}
      input={{ autoComplete: 'off' }}
      theme={{
        hashed: false,
        cssVar: true,
        algorithm:
          theme === 'dark'
            ? [antdTheme.darkAlgorithm, ...compactAlgorithm]
            : [antdTheme.defaultAlgorithm, ...compactAlgorithm],
        token: {
          fontSize: Number(vscodeFontSize) - 1 || 12,
          colorPrimary: primaryColor,
          motionUnit: 0.05, // ==> --ant-motion-duration-fast: 0.1s; --ant-motion-duration-mid: 0.1s; --ant-motion-duration-slow: 0.2s;
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

export default AntdConfigProvider
