import { startTransition } from 'react'
import { initReactI18next } from 'react-i18next'
import i18next from 'i18next'
import ReactDOM from 'react-dom/client'
import { i18nAlly } from 'vite-plugin-i18n-ally/client'
import { CmdToVscode } from '~/message/cmd'
import { FALLBACK_LANGUAGE } from '~/meta'
import { getAppRoot, intelligentPickConfig } from '~/webview/utils'
import { vscodeApi } from '~/webview/vscode-api'
import App from './app'
import './hmr'
import './styles/index.css'

let key = 0

const i18nChangeLanguage = i18next.changeLanguage

export function registerApp(children: JSX.Element, reload = false) {
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
                <App extConfig={ext} vscodeConfig={vscode} workspaceState={workspaceState} key={key}>
                  {children}
                </App>,
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
