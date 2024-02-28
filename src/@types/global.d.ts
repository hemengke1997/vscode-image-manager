import type SharpNS from 'sharp'

declare global {
  type Theme = 'dark' | 'light'

  type TSharp = typeof SharpNS
}

export { SharpNS }
