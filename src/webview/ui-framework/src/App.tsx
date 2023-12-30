import AntdConfigProvider from './components/AntdConfigProvider'
import ThemeProvider from './components/CustomConfigProvider'
import GlobalContext from './contexts/GlobalContext'
import 'antd/dist/reset.css'

interface IAppProps {
  components: Record<string, () => JSX.Element>
}

const NO_CURRENT_VIEW = '$currentView$'

function App(props: IAppProps) {
  const { components } = props
  let currentView = window?.currentView
  if (currentView === NO_CURRENT_VIEW || !currentView) {
    currentView = Object.keys(components)[0]
  }
  const CurrentComponent = components[currentView]

  return (
    <GlobalContext.Provider>
      <AntdConfigProvider>
        <ThemeProvider>
          <CurrentComponent />
        </ThemeProvider>
      </AntdConfigProvider>
    </GlobalContext.Provider>
  )
}

export default App
