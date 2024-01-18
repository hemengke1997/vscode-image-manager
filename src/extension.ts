import { isEqual } from '@minko-fe/lodash-pro'
import fs from 'fs-extra'
import path from 'node:path'
import { type ExtensionContext, type Uri, commands, window } from 'vscode'
import { Context } from './Context'
import { Deps } from './Deps'
import { initCompressor } from './compress'
import { watchConfig } from './config'
import { CmdToWebview } from './message/constant'
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

    context.subscriptions.push(showImageManagerCmd)
  } catch {}

  init(ctx)

  watchConfig()
}

async function init(ctx: Context) {
  initCompressor(ctx)

  try {
    const deps = new Deps()

    deps.on('install-success', () => {
      window.showInformationMessage('Dependencies Installed Successfully. Please Reload', 'Reload').then((res) => {
        if (res === 'Reload') {
          if (ImageManagerPanel.currentPanel?.panel) {
            ImageManagerPanel.render(ctx, true)
          } else {
            // Try to avoid vscode issue `Extensions have been modified on disk. Please reload the window.`
            commands.executeCommand('workbench.action.reloadWindow')
          }
        }
      })
    })

    deps.on('install-fail', () => {
      Log.error('Failed to install dependencies', true)
    })

    const depsInstalled = await deps.init()
    if (depsInstalled) {
      // if user choose sharp as compressor
      // notify webview
      if (ctx.config.compress.method === 'sharp') {
        initCompressor(ctx, true, (c) => {
          ImageManagerPanel.currentPanel?.panel.webview.postMessage({
            cmd: CmdToWebview.COMPRESSOR_CHANGED,
            data: c,
          })
        })
      }
    }
  } catch (e) {
    Log.error(`Init Error: ${JSON.stringify(e)}`)
  }
}
