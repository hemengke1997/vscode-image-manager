import { startTransition, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import { initReactI18next } from 'react-i18next'
import i18next from 'i18next'
import { i18nAlly } from 'vite-plugin-i18n-ally/client'
import { CmdToVscode } from '~/message/cmd'
import { FALLBACK_LANGUAGE } from '~/meta'
import logger from '~/utils/logger'
import { getAppRoot, intelligentPickConfig } from '~/webview/utils'
import { vscodeApi } from '~/webview/vscode-api'
import ImageManager from '.'
import AntdConfigProvider from './components/antd-config-provider'
import Fallback from './components/fallback'
import ActionStore from './stores/action-store'
import FileStore from './stores/file-store'
import FilterStore from './stores/filter-store'
import GlobalStore from './stores/global-store'
import SettingsStore from './stores/settings-store'
import VscodeStore from './stores/vscode-store'
import './hmr'
import './styles/index.css'

let key = 0

const i18nChangeLanguage = i18next.changeLanguage

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
    (data) => {
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

      const { asyncLoadResource } = i18nAlly({
        language,
        onInit() {
          i18next.use(initReactI18next).init({
            returnNull: false,
            react: {
              useSuspense: true,
            },
            debug: false,
            resources: {},
            nsSeparator: '.',
            keySeparator: '.',
            interpolation: {
              escapeValue: false,
            },
            fallbackLng: FALLBACK_LANGUAGE,
          })

          i18next.changeLanguage(language)
        },
        onInited() {
          key = reload ? key + 1 : key

          startTransition(() => {
            reactRoot().render(
              <div onContextMenu={(e) => e.preventDefault()} key={key}>
                <VscodeStore.Provider extConfig={ext} vscodeConfig={vscode} workspaceState={workspaceState}>
                  {children}
                </VscodeStore.Provider>
              </div>,
            )
          })
        },
        onResourceLoaded: (resource, { language }) => {
          i18next.addResourceBundle(language, i18next.options.defaultNS?.[0], resource)
        },
        fallbackLng: FALLBACK_LANGUAGE,
        detection: [
          {
            detect: 'htmlTag',
          },
        ],
      })

      i18next.changeLanguage = async (lang: string, ...args) => {
        await asyncLoadResource(lang)
        return i18nChangeLanguage(lang, ...args)
      }
    },
  )
}

function mount(reload?: boolean) {
  registerApp(
    <GlobalStore.Provider>
      <SettingsStore.Provider>
        <FilterStore.Provider>
          <ActionStore.Provider>
            <FileStore.Provider>
              <AntdConfigProvider>
                {/* Fallback依赖了antd provider */}
                <ErrorBoundary FallbackComponent={Fallback}>
                  <Suspense fallback={<div />}>
                    <ImageManager />
                  </Suspense>
                </ErrorBoundary>
              </AntdConfigProvider>
            </FileStore.Provider>
          </ActionStore.Provider>
        </FilterStore.Provider>
      </SettingsStore.Provider>
    </GlobalStore.Provider>,
    reload,
  )
}

window.mountApp = mount

mount()
