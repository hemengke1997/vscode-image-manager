import { type ExtensionContext, commands } from 'vscode'
import { Context } from './Context'
import { getWorkspaceFolders } from './helper/utils'
import { ImageManagerPanel } from './panel/ImageManagerPanel'

export function activate(context: ExtensionContext) {
  console.log('"Image Manager" is now active')
  const ctx = Context.getInstance(context)

  console.log(getWorkspaceFolders())

  const showImageManagerCmd = commands.registerCommand('image-manager.open-image-manager', () => {
    ImageManagerPanel.render(ctx)
  })

  context.subscriptions.push(showImageManagerCmd)
}
