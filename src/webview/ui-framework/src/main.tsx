import i18next from 'i18next'
import ReactDOM from 'react-dom/client'
import { initReactI18next } from 'react-i18next'
import { setupI18n } from 'vite-plugin-i18n-detector/client'
import { CmdToVscode } from '~/message/cmd'
import { FALLBACK_LANGUAGE } from '~/meta'
import { intelligentPickConfig } from '~/webview/utils'
import { vscodeApi } from '~/webview/vscode-api'
import App from './App'
import './hmr'
import './styles/index.css'
import 'antd/dist/reset.css'

interface IWebviewComponents {
  [componentName: string]: () => JSX.Element
}

i18next.use(initReactI18next).init({
  returnNull: false,
  react: {
    useSuspense: true,
  },
  debug: false,
  resources: {},
  nsSeparator: '.',
  keySeparator: false,
  interpolation: {
    escapeValue: false,
  },
  lowerCaseLng: false,
  fallbackLng: FALLBACK_LANGUAGE,
})

let key = 0

export function registerApp(webviewComponents: IWebviewComponents, reload = false) {
  vscodeApi.postMessage(
    {
      cmd: CmdToVscode.ON_WEBVIEW_READY,
    },
    (data) => {
      const { ext, vscode } = data.config

      const config = intelligentPickConfig(ext, vscode)

      const { language } = config.appearance

      i18next.changeLanguage(language)

      const { loadResourceByLang } = setupI18n({
        language,
        onInited() {
          try {
            if (!window.__react_root__) {
              window.__react_root__ = ReactDOM.createRoot(document.querySelector('#root') as HTMLElement)
            }
          } catch {
          } finally {
            key = reload ? ~key : key

            window.__react_root__.render(
              <App extConfig={ext} vscodeConfig={vscode} key={key} components={webviewComponents} />,
            )
          }
        },
        onResourceLoaded: (langs, currentLang) => {
          Object.keys(langs).forEach((ns) => {
            i18next.addResourceBundle(currentLang, ns, langs[ns], true, true)
          })
        },
        fallbackLng: FALLBACK_LANGUAGE,
        cache: {
          htmlTag: true,
        },
      })

      const _changeLanguage = i18next.changeLanguage
      i18next.changeLanguage = async (lang: string, ...args) => {
        await loadResourceByLang(lang)
        return _changeLanguage(lang, ...args)
      }
    },
  )
}
