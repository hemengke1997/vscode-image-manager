import { isEqual } from '@minko-fe/lodash-pro'
import fs from 'fs-extra'
import path from 'node:path'
import { type Uri, commands } from 'vscode'
import { Global } from '~/core/Global'
import { type ExtensionModule } from '~/module'
import { normalizePath } from '~/utils'
import { ImageManagerPanel } from '~/webview/Panel'
import { Commands } from './commands'

export default <ExtensionModule>function (ctx) {
  let previousRoot: string[] = []

  function openWebview(uri: Uri | undefined) {
    if (uri?.fsPath) {
      // Open via context menu
      // Higher priority than "userConfig'root"
      let fsPath = uri.fsPath
      if (!fs.statSync(fsPath).isDirectory()) {
        fsPath = path.dirname(fsPath) || fsPath
      }
      Global.updateRootPath([normalizePath(fsPath)])
    } else {
      // Open via command palette or shortcut
    }

    // Whether to refresh the webview panel
    const refresh = !isEqual(previousRoot, Global.rootpaths)
    ImageManagerPanel.createOrShow(ctx, refresh)

    previousRoot = Global.rootpaths
  }

  return [commands.registerCommand(Commands.open_webview, openWebview)]
}
