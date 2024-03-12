import { memo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { type ConfigType, type VscodeConfigType } from '~/core/config/common'
import AntdConfigProvider from './components/AntdConfigProvider'
import CustomConfigProvider from './components/CustomConfigProvider'
import Fallback from './components/Fallback'
import FrameworkContext from './contexts/FrameworkContext'

interface IAppProps {
  components: Record<string, () => JSX.Element>
  extConfig: ConfigType
  vscodeConfig: VscodeConfigType
}

function App(props: IAppProps) {
  const { components, extConfig, vscodeConfig } = props
  const CurrentComponent = components[Object.keys(components)[0]]

  return (
    <div onContextMenu={(e) => e.preventDefault()}>
      <FrameworkContext.Provider value={{ extConfig, vscodeConfig }}>
        <AntdConfigProvider>
          <ErrorBoundary FallbackComponent={Fallback}>
            <CustomConfigProvider>
              <CurrentComponent />
            </CustomConfigProvider>
          </ErrorBoundary>
        </AntdConfigProvider>
      </FrameworkContext.Provider>
    </div>
  )
}

export default memo(App)
