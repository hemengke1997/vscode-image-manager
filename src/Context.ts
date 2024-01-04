import { type ExtensionContext, ExtensionMode, window } from 'vscode'

export class Context {
  private static instance: Context
  theme: 'light' | 'dark' = 'dark'

  constructor(public ext: ExtensionContext) {
    // TODO: onDidChangeActiveColorTheme
    {
      switch (window.activeColorTheme.kind) {
        case 1:
          this.theme = 'light'
          break
        case 2:
          this.theme = 'dark'
          break
        default:
          break
      }
    }
  }

  public static getInstance(ext?: ExtensionContext) {
    if (!Context.instance && ext) {
      Context.instance = new Context(ext)
    }

    return Context.instance
  }

  /**
   * Check if the extension is in production/development mode
   */
  public get isProductionMode(): boolean {
    return this.ext.extensionMode === ExtensionMode.Production
  }
}
