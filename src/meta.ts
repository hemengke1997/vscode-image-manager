export enum Theme {
  dark = 'dark',
  light = 'light',
  auto = 'auto',
}

export enum Language {
  en = 'en',
  zh_CN = 'zh-CN',
  zh_TW = 'zh-TW',
  ja = 'ja',
  de = 'de',
  auto = 'auto',
}

export enum ReduceMotion {
  auto = 'auto',
  on = 'on',
  off = 'off',
}

export enum Compressed {
  yes = 1,
  no = 2,
  unknown = 3,
  not_supported = 4,
}

export const EXT_NAMESPACE = 'image-manager'
export const EXT_ID = 'minko.image-manager'
export const EXT_NAME = 'Image Manager'

export const FALLBACK_LANGUAGE = Language.en
export const DEV_PORT = 4433
export const REACT_DEVTOOLS_PORT = 8097

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
  {
    key: Language.de,
    label: 'Deutsch',
  },
]

// preload helper
export const PRELOAD_HELPER = 'window.__vscode_preload_url__'
