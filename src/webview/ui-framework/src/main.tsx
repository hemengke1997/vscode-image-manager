import i18next from 'i18next'
import ReactDOM from 'react-dom/client'
import { initReactI18next } from 'react-i18next'
import { setupI18n } from 'vite-plugin-i18n-detector/client'
import { localStorageEnum } from '../../local-storage'
import App from './App'
import { parseJson } from './utils/json'
import 'antd/dist/reset.css'
import './styles/index.css'

const root = ReactDOM.createRoot(document.querySelector('#root') as HTMLElement)

interface IWebviewComponents {
  [componentName: string]: () => JSX.Element
}

const FALLBACKLANG = 'en'

i18next.use(initReactI18next).init({
  returnNull: false,
  react: {
    useSuspense: true,
  },
  debug: import.meta.env.DEV,
  resources: {},
  nsSeparator: '.',
  keySeparator: false,
  interpolation: {
    escapeValue: false,
  },
  lowerCaseLng: true,
  fallbackLng: FALLBACKLANG,
})

export function registerApp(webviewComponents: IWebviewComponents) {
  const vscodeEnv = window.vscodeEnv

  const lng =
    parseJson(localStorage.getItem(localStorageEnum.LOCAL_STORAGE_LOCALE_KEY)) || vscodeEnv?.language || FALLBACKLANG

  const vscodeTheme = parseJson(localStorage.getItem(localStorageEnum.LOCAL_STORAGE_THEME_KEY)) || window.vscodeTheme

  i18next.changeLanguage(lng)

  const { loadResourceByLang } = setupI18n({
    language: lng,
    onInited() {
      root.render(<App theme={vscodeTheme} components={webviewComponents} />)
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
}
