import type { Disposable, ExtensionContext } from 'vscode'

export type ExtensionModule = {
  (ctx: ExtensionContext): Disposable | Disposable[]
}
