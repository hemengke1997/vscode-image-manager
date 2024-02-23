import { type Disposable, type ExtensionContext } from 'vscode'

export interface ExtensionModule {
  (ctx: ExtensionContext): Disposable | Disposable[]
}
