import { ErrorBoundary } from 'react-error-boundary'
import AntdConfigProvider from './components/AntdConfigProvider'
import ThemeProvider from './components/CustomConfigProvider'
import Fallback from './components/Fallback'
import FrameworkContext from './contexts/FrameworkContext'

interface IAppProps {
  components: Record<string, () => JSX.Element>
  theme: Theme
  language: Language
}

function App(props: IAppProps) {
  const { components, theme, language } = props
  const CurrentComponent = components[Object.keys(components)[0]]

  return (
    <div onContextMenu={(e) => e.preventDefault()}>
      <FrameworkContext.Provider value={{ theme, language }}>
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
