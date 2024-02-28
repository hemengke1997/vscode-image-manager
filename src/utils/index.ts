import os from 'node:os'
import path from 'node:path'

const windowsSlashRE = /\\/g
function slash(p: string): string {
  return p.replace(windowsSlashRE, '/')
}

export const isWindows = os.platform() === 'win32'

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id)
}

export function isPng(filePath: string) {
  return isSomeImageType(filePath, ['png'])
}

export function isJpg(filePath: string) {
  return isSomeImageType(filePath, ['jpg', 'jpeg'])
}

function isSomeImageType(filePath: string, type: string[]) {
  const ext = path.extname(filePath).toLowerCase()
  if (!ext) return type.some((t) => t === filePath)
  return type.some((t) => ext === `.${t}`)
}
