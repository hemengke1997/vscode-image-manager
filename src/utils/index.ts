import os from 'node:os'
import path from 'node:path'

const windowsSlashRE = /\\/g
function slash(p: string): string {
  return p.replace(windowsSlashRE, '/')
}

const isWindows = os.platform() === 'win32'

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id)
}

export function detectSharp() {
  try {
    require.resolve('sharp')
    delete require.cache[require.resolve('sharp')]
    return true
  } catch {
    delete require.cache[require.resolve('sharp')]
    return false
  }
}
