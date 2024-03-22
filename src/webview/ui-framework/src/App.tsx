import { memo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { type ConfigType, type VscodeConfigType } from '~/core/config/common'
import { type WorkspaceStateType } from '~/core/persist/workspace/common'
import AntdConfigProvider from './components/AntdConfigProvider'
import CustomConfigProvider from './components/CustomConfigProvider'
import Fallback from './components/Fallback'
import FrameworkContext from './contexts/FrameworkContext'
import VscodeContext from './contexts/VscodeContext'

type AppProps = {
  components: Record<string, () => JSX.Element>
  extConfig: ConfigType
  vscodeConfig: VscodeConfigType
  workspaceState: WorkspaceStateType
}

function App(props: AppProps) {
  const { components, extConfig, vscodeConfig, workspaceState } = props
  const CurrentComponent = components[Object.keys(components)[0]]

  return (
    <div onContextMenu={(e) => e.preventDefault()}>
      <VscodeContext.Provider value={{ extConfig, vscodeConfig, workspaceState }}>
        <FrameworkContext.Provider>
          <AntdConfigProvider>
            <ErrorBoundary FallbackComponent={Fallback}>
              <CustomConfigProvider>
                <CurrentComponent />
              </CustomConfigProvider>
            </ErrorBoundary>
          </AntdConfigProvider>
        </FrameworkContext.Provider>
      </VscodeContext.Provider>
    </div>
  )
}

export default memo(App)
