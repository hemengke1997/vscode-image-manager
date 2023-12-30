import { App, ConfigProvider, theme } from 'antd'
import { type FC, type PropsWithChildren } from 'react'
import GlobalContext from '@/contexts/GlobalContext'

const AntdConfigProvider: FC<PropsWithChildren> = ({ children }) => {
  const { appearance } = GlobalContext.usePicker(['appearance'])

  return (
    <ConfigProvider
      autoInsertSpaceInButton={false}
      input={{ autoComplete: 'off' }}
      theme={{
        hashed: false,
        cssVar: true,
        algorithm: appearance.theme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: appearance.primaryColor,
        },
      }}
    >
      <App
        className={'bg-ant-color-bg-layout'}
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
