import path from 'node:path'
import fs from 'fs-extra'
import { slashPath } from '~/utils'
import { FileCache } from '../file-cache'
import { Global } from '../global'

export class SharpjsCache {
  extensionCwd = Global.context.extensionUri.fsPath
  osCacheDir = slashPath(path.join(FileCache.cacheDir, 'lib/sharp'))
  extensionCacheDir = slashPath(path.join(this.extensionCwd, 'dist/lib/sharp'))

  constructor() {
    this.addToOsCache()
  }

  private async addToOsCache() {
    if (FileCache.osCachable) {
      await fs.ensureDir(this.osCacheDir)
      await fs.copy(this.extensionCacheDir, this.osCacheDir)
    }
  }

  getSharpPath() {
    const paths = [this.osCacheDir, this.extensionCacheDir].map(t => path.join(t, 'index.js'))

    return paths.find((file) => {
      try {
        const exist = fs.existsSync(file)
        if (exist) {
          return file
        }
        return false
      }
      catch {
        return false
      }
    })
  }
}
