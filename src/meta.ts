import { Language } from './enums'

export const EXT_NAMESPACE = 'image-manager'
export const EXT_ID = 'minko.image-manager'
export const EXT_NAME = 'Image Manager'

export const FALLBACK_LANGUAGE = Language.en
export const DEV_PORT = 4433

// webview/locales/*.json
export const locales = [
  {
    key: Language.en,
    label: 'English',
  },
  {
    key: Language.zh_CN,
    label: '简体中文',
  },
  {
    key: Language.zh_TW,
    label: '繁體中文',
  },
  {
    key: Language.ja,
    label: '日本語',
  },
]

// preload helper
export const PRELOAD_HELPER = 'window.__vscode_preload_url__'
