import os from 'node:os'
import path from 'node:path'
import { isFsWritable } from '~/utils/node'
import { Global } from './global'

export class FileCache {
  private static osDirs = [os.homedir(), os.tmpdir()]
  static osCachable = this.osDirs.find(dir => isFsWritable(dir))

  /**
   * @returns
   * /{tmpdir}/vscode-image-manager-cache
   * or
   * /{homedir}/vscode-image-manager-cache
   * or
   * /{extension-cwd}/dist
   */
  static get cacheDir() {
    let cacheDir: string
    if (this.osCachable) {
      // 可以写到系统临时盘中
      cacheDir = path.resolve(this.osCachable, '.vscode-image-manager-cache')
    }
    else {
      // 否则写到扩展根目录下的 dist 目录中
      cacheDir = path.join(Global.context.extensionUri.fsPath, 'dist')
    }

    return cacheDir
  }
}
