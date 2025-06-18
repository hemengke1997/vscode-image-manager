import type { Disposable, ExtensionContext } from 'vscode'

export interface ExtensionModule {
  (ctx: ExtensionContext): Disposable | Disposable[]
}
