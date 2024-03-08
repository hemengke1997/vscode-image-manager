import type SharpNS from 'sharp'

declare global {
  type Theme = 'dark' | 'light'
  type Language = 'en' | 'zh-CN'

  type TSharp = typeof SharpNS

  interface Window {
    __react_root__: ReactDOM.Root
    mountApp: (reload?: boolean) => void
  }
}

export { SharpNS }
