import type SharpNS from 'sharp'

declare global {
  type Theme = 'dark' | 'light' | 'auto'
  type Language = 'en' | 'zh-CN' | 'auto'

  type TSharp = typeof SharpNS

  interface Window {
    __react_root__: ReactDOM.Root
    mountApp: (reload?: boolean) => void
  }
}

export { SharpNS }
