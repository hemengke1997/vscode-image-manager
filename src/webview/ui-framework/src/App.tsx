import AntdConfigProvider from './components/AntdConfigProvider'
import ThemeProvider from './components/CustomConfigProvider'
import GlobalContext from './contexts/GlobalContext'
import 'antd/dist/reset.css'

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
        <ThemeProvider>
          <CurrentComponent />
        </ThemeProvider>
      </AntdConfigProvider>
    </GlobalContext.Provider>
  )
}

export default App
