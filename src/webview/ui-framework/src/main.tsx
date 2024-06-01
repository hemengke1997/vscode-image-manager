import i18next from 'i18next'
import ReactDOM from 'react-dom/client'
import { initReactI18next } from 'react-i18next'
import { i18nAlly } from 'vite-plugin-i18n-ally/client'
import { CmdToVscode } from '~/message/cmd'
import { FALLBACK_LANGUAGE } from '~/meta'
import { getAppRoot, intelligentPickConfig } from '~/webview/utils'
import { vscodeApi } from '~/webview/vscode-api'
import App from './App'
import './hmr'
import './styles/index.css'
import 'antd/dist/reset.css'

declare global {
  interface Window {
    /**
     * react root
     */
    __react_root__: ReactDOM.Root
  }
}

type WebviewComponents = {
  [key: string]: () => JSX.Element
}

i18next.use(initReactI18next).init({
  returnNull: false,
  react: {
    useSuspense: true,
  },
  debug: true,
  resources: {},
  nsSeparator: false,
  keySeparator: '.',
  interpolation: {
    escapeValue: false,
  },
  lowerCaseLng: false,
  fallbackLng: FALLBACK_LANGUAGE,
})

const i18nChangeLanguage = i18next.changeLanguage

let key = 0

export function registerApp(webviewComponents: WebviewComponents, reload = false) {
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

      i18next.changeLanguage(language)

      const { beforeLanguageChange } = i18nAlly({
        language,
        onInited() {
          try {
            if (!window.__react_root__) {
              window.__react_root__ = ReactDOM.createRoot(getAppRoot())
            }
          } catch {
          } finally {
            key = reload ? ~key : key

            window.__react_root__.render(
              <App
                extConfig={ext}
                vscodeConfig={vscode}
                workspaceState={workspaceState}
                key={key}
                components={webviewComponents}
              />,
            )
          }
        },
        onResourceLoaded: (resource, currentLang) => {
          i18next.addResourceBundle(currentLang, i18next.options.defaultNS?.[0], resource)
        },
        fallbackLng: FALLBACK_LANGUAGE,
        cache: {
          htmlTag: true,
        },
      })

      i18next.changeLanguage = async (lang: string, ...args) => {
        await beforeLanguageChange(lang)
        return i18nChangeLanguage(lang, ...args)
      }
    },
  )
}
