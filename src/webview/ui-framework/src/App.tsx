import { ErrorBoundary } from 'react-error-boundary'
import AntdConfigProvider from './components/AntdConfigProvider'
import ThemeProvider from './components/CustomConfigProvider'
import Fallback from './components/Fallback'
import GlobalContext from './contexts/GlobalContext'

interface IAppProps {
  components: Record<string, () => JSX.Element>
  theme: Window['vscodeTheme']
}

function App(props: IAppProps) {
  const { components, theme } = props
  let currentView = window?.currentView
  if (!currentView) {
    currentView = Object.keys(components)[0]
  }
  const CurrentComponent = components[currentView]

  return (
    <GlobalContext.Provider value={{ theme }}>
      <AntdConfigProvider>
        <ErrorBoundary onReset={() => console.log('reset')} FallbackComponent={Fallback}>
          <ThemeProvider>
            <CurrentComponent />
          </ThemeProvider>
        </ErrorBoundary>
      </AntdConfigProvider>
    </GlobalContext.Provider>
  )
}

export default App
