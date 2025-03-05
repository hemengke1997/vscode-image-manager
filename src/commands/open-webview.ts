import { isEqual } from 'lodash-es'
import path from 'node:path'
import { commands, FileType, type Uri, workspace } from 'vscode'
import { Config } from '~/core'
import { Global } from '~/core/global'
import { type ExtensionModule } from '~/module'
import { normalizePath } from '~/utils'
import { ImageManagerPanel } from '~/webview/panel'
import { Commands } from './commands'

export default <ExtensionModule>function (ctx) {
  let previousRoot: string[] = []
  let sharpInstalled: boolean

  async function openWebview(uri: Uri | undefined) {
    let imagePath = ''
    if (uri?.fsPath) {
      let rootPath = ''
      // Open via context menu
      // Higher priority than "userConfig'root"
      const fsPath = normalizePath(uri.fsPath)
      const stat = await workspace.fs.stat(uri)
      if (stat.type !== FileType.Directory) {
        rootPath = path.dirname(fsPath)
        imagePath = fsPath
      } else {
        rootPath = fsPath
      }

      Global.updateRootPath([normalizePath(rootPath)])
    } else {
      // Open via command palette or shortcut
    }

    try {
      if (Config.core_installDependencies) {
        // 不必每次打开插件时都安装 sharp
        // 只要一次失败，就认为不支持 sharp
        if (sharpInstalled !== false) {
          await Global.installSharp()
          sharpInstalled = true
        }
      }
    } catch {
      sharpInstalled = false
    } finally {
      // Whether to reload the webview panel
      const reload = !isEqual(previousRoot, Global.rootpaths)
      ImageManagerPanel.createOrShow({
        ctx,
        reload,
        webviewInitialData: {
          imageReveal: imagePath,
          sharpInstalled,
        },
      })

      previousRoot = Global.rootpaths
    }
  }

  return [commands.registerCommand(Commands.open_webview, openWebview)]
}
