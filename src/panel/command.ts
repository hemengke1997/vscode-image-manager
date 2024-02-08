import { isEqual } from '@minko-fe/lodash-pro'
import fs from 'fs-extra'
import path from 'node:path'
import { type Uri, commands } from 'vscode'
import { type Context } from '@/Context'
import { normalizePath } from '@/utils'
import { ImageManagerPanel } from './ImageManagerPanel'

export function openPanelCmd(ctx: Context) {
  try {
    let previousRoot: string[] = []
    const showImageManagerCmd = commands.registerCommand('image-manager.open-image-manager', (uri: Uri | undefined) => {
      if (uri?.fsPath) {
        // Open via context menu
        // Higher priority `Config.root()`
        let fsPath = uri.fsPath
        if (!fs.statSync(fsPath).isDirectory()) {
          fsPath = path.dirname(fsPath) || fsPath
        }
        ctx.setConfig({
          root: [normalizePath(fsPath)],
        })
      } else {
        // Open via command palette or shortcut
      }

      const restart = !isEqual(previousRoot, ctx.config.root)
      ImageManagerPanel.render(ctx, restart)

      previousRoot = ctx.config.root
    })

    return showImageManagerCmd
  } catch {}
}
