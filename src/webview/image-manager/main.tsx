import { startTransition } from 'react'
import ReactDOM from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import { initReactI18next } from 'react-i18next'
import { Transition } from 'react-transition-preset'
import Logo from '~root/assets/logo.svg?react'
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
import ActionContext from './contexts/action-context'
import FileContext from './contexts/file-context'
import FilterContext from './contexts/filter-context'
import GlobalContext from './contexts/global-context'
import SettingsContext from './contexts/settings-context'
import VscodeContext from './contexts/vscode-context'
import './hmr'
import './styles/index.css'

let key = 0

const i18nChangeLanguage = i18next.changeLanguage

function getReactRoot() {
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
          key = reload ? ~key : key

          startTransition(() => {
            getReactRoot().render(
              <div onContextMenu={(e) => e.preventDefault()} key={key}>
                <VscodeContext.Provider value={{ extConfig: ext, vscodeConfig: vscode, workspaceState }}>
                  {children}
                </VscodeContext.Provider>
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
  getReactRoot().render(
    <div className={'flex h-screen w-screen items-center justify-center bg-vscode-editor-background'}>
      <Transition mounted={true} enterDelay={200} initial={true} transition={'fade'}>
        <Logo className={'animate-bounce text-6xl'} />
      </Transition>
    </div>,
  )

  registerApp(
    <GlobalContext.Provider>
      <SettingsContext.Provider>
        <FilterContext.Provider>
          <ActionContext.Provider>
            <FileContext.Provider>
              <AntdConfigProvider>
                <ErrorBoundary FallbackComponent={Fallback}>
                  <ImageManager />
                </ErrorBoundary>
              </AntdConfigProvider>
            </FileContext.Provider>
          </ActionContext.Provider>
        </FilterContext.Provider>
      </SettingsContext.Provider>
    </GlobalContext.Provider>,
    reload,
  )
}

window.mountApp = mount

mount()
