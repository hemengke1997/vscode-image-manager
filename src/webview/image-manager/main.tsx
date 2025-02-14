import { startTransition } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { initReactI18next } from 'react-i18next'
import i18next from 'i18next'
import ReactDOM from 'react-dom/client'
import { i18nAlly } from 'vite-plugin-i18n-ally/client'
import { CmdToVscode } from '~/message/cmd'
import { FALLBACK_LANGUAGE } from '~/meta'
import { getAppRoot, intelligentPickConfig } from '~/webview/utils'
import { vscodeApi } from '~/webview/vscode-api'
import ImageManager from '.'
import AntdConfigProvider from './components/antd-config-provider'
import Fallback from './components/fallback'
import ActionContext from './contexts/action-context'
import CtxMenuContext from './contexts/ctx-menu-context'
import FilterContext from './contexts/filter-context'
import GlobalContext from './contexts/global-context'
import SettingsContext from './contexts/settings-context'
import VscodeContext from './contexts/vscode-context'
import './hmr'
import './styles/index.css'

let key = 0

const i18nChangeLanguage = i18next.changeLanguage

function registerApp(children: JSX.Element, reload = false) {
  vscodeApi.postMessage(
    {
      cmd: CmdToVscode.on_webview_ready,
    },
    (data) => {
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
            lowerCaseLng: false,
            fallbackLng: FALLBACK_LANGUAGE,
          })

          i18next.changeLanguage(language)
        },
        onInited() {
          try {
            if (!window.__react_root__) {
              window.__react_root__ = ReactDOM.createRoot(getAppRoot())
            }
          } catch {
          } finally {
            key = reload ? ~key : key

            startTransition(() => {
              window.__react_root__.render(
                <div onContextMenu={(e) => e.preventDefault()}>
                  <VscodeContext.Provider value={{ extConfig: ext, vscodeConfig: vscode, workspaceState }}>
                    {children}
                  </VscodeContext.Provider>
                </div>,
              )
            })
          }
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
    <GlobalContext.Provider>
      <SettingsContext.Provider>
        <FilterContext.Provider>
          <ActionContext.Provider>
            <CtxMenuContext.Provider>
              <AntdConfigProvider>
                <ErrorBoundary FallbackComponent={Fallback}>
                  <ImageManager />
                </ErrorBoundary>
              </AntdConfigProvider>
            </CtxMenuContext.Provider>
          </ActionContext.Provider>
        </FilterContext.Provider>
      </SettingsContext.Provider>
    </GlobalContext.Provider>,
    reload,
  )
}

window.mountApp = mount

mount()
