import { isEqual } from '@minko-fe/lodash-pro'
import fs from 'node:fs'
import path from 'node:path'
import { type ExtensionContext, type Uri, commands } from 'vscode'
import { Context } from './Context'
import { initCompressor } from './compress'
import { watchConfig } from './config'
import { ImageManagerPanel } from './panel/ImageManagerPanel'
import { normalizePath } from './utils'
import { Log } from './utils/Log'

export function activate(context: ExtensionContext) {
  Log.info('"Image Manager" is now active')

  const ctx = Context.init(context)

  try {
    let previousRoot: string[] = []
    const showImageManagerCmd = commands.registerCommand('image-manager.open-image-manager', (uri: Uri | undefined) => {
      if (uri?.fsPath) {
        // Open via context menu
        // Higher priority `Config.root()`
        let fsPath = uri.fsPath
        if (!fs.statSync(fsPath).isDirectory()) {
          fsPath ||= path.posix.dirname(fsPath)
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

    context.subscriptions.push(showImageManagerCmd)
  } catch {}

  initCompressor(ctx)

  watchConfig()
}
