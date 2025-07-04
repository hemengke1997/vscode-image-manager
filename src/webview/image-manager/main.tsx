import { Provider as JotaiProvider } from 'jotai'
import { startTransition, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import { CmdToVscode } from '~/message/cmd'
import logger from '~/utils/logger'
import { getAppRoot, intelligentPickConfig } from '~/webview/utils'
import { vscodeApi } from '~/webview/vscode-api'
import ImageManager from '.'
import AntdConfigProvider from './components/antd-config-provider'
import Fallback from './components/fallback'
import { initI18n } from './i18n'
import { VscodeAtomsHydrator } from './stores/vscode/vscode-store'
import './styles/index.css'
import './hmr'

let key = 0

function reactRoot() {
  if (!window.__react_root__) {
    window.__react_root__ = ReactDOM.createRoot(getAppRoot())
  }
  return window.__react_root__
}

function registerApp(children: JSX.Element, reload = false) {
  vscodeApi.postMessage(
    {
      cmd: CmdToVscode.on_webview_ready,
    },
    async (data) => {
      logger.debug(CmdToVscode.on_webview_ready, data)
      const {
        config: { ext, vscode },
        workspaceState,
        windowState,
      } = data

      Object.keys(windowState).forEach((key) => {
        window[key] = windowState[key]
      })

      const config = intelligentPickConfig(ext, vscode)

      const { language } = config.appearance

      await initI18n({ lng: language })

      key = reload ? key + 1 : key

      startTransition(() => {
        reactRoot().render(
          <JotaiProvider>
            <div onContextMenu={e => e.preventDefault()} key={key}>
              <VscodeAtomsHydrator extConfig={ext} vscodeConfig={vscode} workspaceState={workspaceState}>
                {children}
              </VscodeAtomsHydrator>
            </div>
          </JotaiProvider>,
        )
      })
    },
  )
}

function mount(reload?: boolean) {
  registerApp(
    <AntdConfigProvider>
      {/* Fallback依赖了antd provider */}
      <ErrorBoundary FallbackComponent={Fallback}>
        <Suspense fallback={null}>
          <ImageManager />
        </Suspense>
      </ErrorBoundary>
    </AntdConfigProvider>,
    reload,
  )
}

window.mountApp = mount

mount()
