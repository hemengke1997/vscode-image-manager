import os from 'node:os'
import path from 'node:path'
import { isFsWritable } from '~/utils'
import { Global } from './global'

export class FileCache {
  static osCachable: boolean = false

  /**
   * @returns
   * /{tmpdir}/vscode-image-manager-cache
   * or
   * /{homedir}/vscode-image-manager-cache
   * or
   * /{extension-cwd}/dist
   */
  static get cacheDir() {
    const osCacheDir = [os.homedir(), os.tmpdir()].find((dir) => isFsWritable(dir))

    let cacheDir: string
    if (osCacheDir) {
      // 可以写到系统临时盘中
      this.osCachable = true
      cacheDir = path.resolve(osCacheDir, '.vscode-image-manager-cache')
    } else {
      this.osCachable = false
      // 否则写到扩展根目录下的 dist 目录中
      cacheDir = path.join(Global.context.extensionUri.fsPath, 'dist')
    }

    return cacheDir
  }
}
