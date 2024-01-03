import { castArray } from '@minko-fe/lodash-pro'
import { execa, execaSync } from 'execa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { type PlatformClipboard } from '..'

const env = {
  LC_CTYPE: 'UTF-8',
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const macosBinaryPath = path.join(__dirname, './bin/cb')

const clipboard: PlatformClipboard = {
  async copy(source, options) {
    source = castArray(source)
    return execa(macosBinaryPath, ['copy', ...source], { ...options, env })
  },
  async paste(destination, options) {
    destination = castArray(destination)
    const { stdout } = await execa(macosBinaryPath, ['paste', ...destination], { ...options, env })
    return stdout
  },
  copySycn(source, options) {
    source = castArray(source)
    return execaSync(macosBinaryPath, ['copy', ...source], { ...options, env })
  },
  pasteSync(destination, options) {
    destination = castArray(destination)
    const { stdout } = execaSync(macosBinaryPath, ['paste', ...destination], { ...options, env })
    return stdout
  },
}

export default clipboard
