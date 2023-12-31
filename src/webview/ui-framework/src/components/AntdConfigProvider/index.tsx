import { App, ConfigProvider, theme as antdTheme } from 'antd'
import { type FC, type PropsWithChildren } from 'react'
import GlobalContext from '@/contexts/GlobalContext'
import { getCssVar } from '@/utils/theme'

const AntdConfigProvider: FC<PropsWithChildren> = ({ children }) => {
  const { theme, primaryColor } = GlobalContext.usePicker(['theme', 'primaryColor'])

  const vscodeFontSize = getCssVar('--vscode-font-size').split('px')[0]

  return (
    <ConfigProvider
      autoInsertSpaceInButton={false}
      input={{ autoComplete: 'off' }}
      theme={{
        hashed: false,
        cssVar: true,
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          fontSize: Number(vscodeFontSize) || 12,
          colorPrimary: primaryColor,
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
      >
        {children}
      </App>
    </ConfigProvider>
  )
}

export default AntdConfigProvider
