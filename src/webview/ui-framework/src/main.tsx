import i18next from 'i18next'
import ReactDOM from 'react-dom/client'
import { initReactI18next } from 'react-i18next'
import { setupI18n } from 'vite-plugin-i18n-detector/client'
import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '~/webview/vscode-api'
import App from './App'
import './hmr'
import './styles/index.css'
import 'antd/dist/reset.css'

interface IWebviewComponents {
  [componentName: string]: () => JSX.Element
}

const FALLBACKLANG = 'en'

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
  fallbackLng: FALLBACKLANG,
})

let key = 0

export function registerApp(webviewComponents: IWebviewComponents, reload = false) {
  console.log('registerApp')
  vscodeApi.postMessage(
    {
      cmd: CmdToVscode.ON_WEBVIEW_READY,
    },
    (data) => {
      const { language, theme } = data.config.appearance

      const lng = language || FALLBACKLANG

      i18next.changeLanguage(lng)

      const { loadResourceByLang } = setupI18n({
        language: lng,
        onInited() {
          try {
            if (!window.__react_root__) {
              window.__react_root__ = ReactDOM.createRoot(document.querySelector('#root') as HTMLElement)
            }
          } catch {
          } finally {
            key = reload ? ~key : key
            const vscodeTheme = theme

            window.__react_root__.render(
              <App theme={vscodeTheme} language={lng} key={key} components={webviewComponents} />,
            )
          }
        },
        onResourceLoaded: (langs, currentLang) => {
          Object.keys(langs).forEach((ns) => {
            i18next.addResourceBundle(currentLang, ns, langs[ns], true, true)
          })
        },
        fallbackLng: FALLBACKLANG,
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
