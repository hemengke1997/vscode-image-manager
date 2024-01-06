import { type ExtensionContext, ExtensionMode, type WorkspaceFolder, window, workspace } from 'vscode'
import { Config } from './config'
import Watcher from './watcher'

export class Context {
  private static instance: Context
  public theme: 'light' | 'dark' = 'dark'

  constructor(public ext: ExtensionContext) {
    // TODO: onDidChangeActiveColorTheme
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

  public static getInstance(ext?: ExtensionContext) {
    if (!Context.instance && ext) {
      Context.instance = new Context(ext)
    }

    return Context.instance
  }

  public get config() {
    return Config
  }

  public get watcher() {
    return new Watcher(this)
  }

  public get workspaceRootPath(): WorkspaceFolder | undefined {
    return workspace.workspaceFolders?.[0]
  }

  public get isProductionMode(): boolean {
    return this.ext.extensionMode === ExtensionMode.Production
  }
}
