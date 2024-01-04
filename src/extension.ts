import { type ExtensionContext, commands } from 'vscode'
import { Context } from './Context'
import { getClipboard } from './clipboard'
import { ImageManagerPanel } from './panel/ImageManagerPanel'

export function activate(context: ExtensionContext) {
  console.log('"Image Manager" is now active')
  const ctx = Context.getInstance(context)

  const showImageManagerCmd = commands.registerCommand('image-manager.open-image-manager', () => {
    ImageManagerPanel.render(ctx)
  })

  getClipboard().then((c) => {
    c.paste({})
  })

  context.subscriptions.push(showImageManagerCmd)
}
