import { type ExtensionContext, commands } from 'vscode'
import { Context } from './Context'
import { ImageAnalysorPanel } from './panel/ImageAnalysorPanel'

export function activate(context: ExtensionContext) {
  console.log('"Image Analysor" is now active')
  const ctx = new Context(context)

  const showImageAnalysorCmd = commands.registerCommand('image-analysor.open-image-analysor', () => {
    ImageAnalysorPanel.render(ctx)
  })

  context.subscriptions.push(showImageAnalysorCmd)
}
