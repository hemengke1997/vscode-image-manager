import { isEqual } from '@minko-fe/lodash-pro'
import path from 'node:path'
import { commands, FileType, type Uri, workspace } from 'vscode'
import { Global } from '~/core/global'
import { type ExtensionModule } from '~/module'
import { normalizePath } from '~/utils'
import { ImageManagerPanel } from '~/webview/panel'
import { Commands } from './commands'

export default <ExtensionModule>function (ctx) {
  let previousRoot: string[] = []
  let sharpInstalled = false

  async function openWebview(uri: Uri | undefined) {
    let imagePath = ''
    if (uri?.fsPath) {
      let rootPath = ''
      // Open via context menu
      // Higher priority than "userConfig'root"
      const fsPath = uri.fsPath
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

    // init sharp here
    if (!sharpInstalled) {
      try {
        await Global.installSharp()
        sharpInstalled = true
      } catch {
        sharpInstalled = false
      }
    }

    if (sharpInstalled) {
      // Whether to reload the webview panel
      const reload = !isEqual(previousRoot, Global.rootpaths)
      ImageManagerPanel.createOrShow(ctx, reload, imagePath)

      previousRoot = Global.rootpaths
    }
  }

  return [commands.registerCommand(Commands.open_webview, openWebview)]
}
