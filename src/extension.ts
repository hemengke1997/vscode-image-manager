import { isEqual } from '@minko-fe/lodash-pro'
import { type ExtensionContext, type Uri, commands } from 'vscode'
import { Context } from './Context'
import { ImageManagerPanel } from './panel/ImageManagerPanel'

export function activate(context: ExtensionContext) {
  console.log('"Image Manager" is now active')

  let previousRoot: string[] = []

  const showImageManagerCmd = commands.registerCommand('image-manager.open-image-manager', (uri: Uri | undefined) => {
    const ctx = Context.getInstance(context)
    if (uri?.fsPath) {
      // Open via context menu
      // Higher priority `Config.root()`
      ctx.setConfig({
        root: [uri.fsPath],
      })
    } else {
      // Open via command palette or shortcut
    }

    const restart = !isEqual(previousRoot, ctx.config.root)
    ImageManagerPanel.render(ctx, restart)

    previousRoot = ctx.config.root
  })

  context.subscriptions.push(showImageManagerCmd)
}
