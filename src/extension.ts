import { type ExtensionContext, commands } from 'vscode'
import { Context } from './Context'
import { ImageManagerPanel } from './panel/ImageManagerPanel'

export function activate(context: ExtensionContext) {
  console.log('"Image Manager" is now active')
  const ctx = new Context(context)

  const showImageManagerCmd = commands.registerCommand('image-manager.open-image-manager', () => {
    ImageManagerPanel.render(ctx)
  })

  context.subscriptions.push(showImageManagerCmd)
}
