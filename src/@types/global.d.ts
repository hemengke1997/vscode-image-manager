import type SharpNS from 'sharp'

declare global {
  type Theme = 'dark' | 'light'
  type Language = 'en' | 'zh-CN'

  type TSharp = typeof SharpNS
}

export { SharpNS }
