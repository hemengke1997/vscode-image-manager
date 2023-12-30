import { App, ConfigProvider, theme } from 'antd'
import { type FC, type PropsWithChildren } from 'react'
import GlobalContext from '@/contexts/GlobalContext'
import { getCssVar } from '@/utils/theme'

const AntdConfigProvider: FC<PropsWithChildren> = ({ children }) => {
  const { appearance } = GlobalContext.usePicker(['appearance'])

  const vscodeFontSize = getCssVar('--vscode-font-size').split('px')[0]

  return (
    <ConfigProvider
      autoInsertSpaceInButton={false}
      input={{ autoComplete: 'off' }}
      theme={{
        hashed: false,
        cssVar: true,
        algorithm: appearance.theme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          fontSize: Number(vscodeFontSize) || 12,
          colorPrimary: appearance.primaryColor,
        },
      }}
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
