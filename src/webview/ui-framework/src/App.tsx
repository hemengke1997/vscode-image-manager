import { ErrorBoundary } from 'react-error-boundary'
import AntdConfigProvider from './components/AntdConfigProvider'
import ThemeProvider from './components/CustomConfigProvider'
import Fallback from './components/Fallback'
import FrameworkContext from './contexts/FrameworkContext'

interface IAppProps {
  components: Record<string, () => JSX.Element>
  theme: Theme
}

function App(props: IAppProps) {
  const { components, theme } = props
  const CurrentComponent = components[Object.keys(components)[0]]

  return (
    <div onContextMenu={(e) => e.preventDefault()}>
      <FrameworkContext.Provider value={{ theme }}>
        <AntdConfigProvider>
          <ErrorBoundary FallbackComponent={Fallback}>
            <ThemeProvider>
              <CurrentComponent />
            </ThemeProvider>
          </ErrorBoundary>
        </AntdConfigProvider>
      </FrameworkContext.Provider>
    </div>
  )
}

export default App
