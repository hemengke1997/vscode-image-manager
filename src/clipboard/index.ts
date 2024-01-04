import isWSL from 'is-wsl'
import type UnClipboard from './UnClipboard'

async function getClipboard(): Promise<UnClipboard> {
  switch (process.platform) {
    case 'darwin': {
      return (await import('./macos')).default
    }
    case 'win32': {
      return (await import('./windows')).default
    }

    case 'linux': {
      return (await import('./linux')).default
    }
    default: {
      if (isWSL) {
        return (await import('./windows')).default
      }

      return (await import('./linux')).default
    }
  }
}

export { getClipboard }
