import { type Event, EventEmitter, type ExtensionContext, window, workspace } from 'vscode'
import { Compressor } from '~/core/compress/Compressor'
import { Installer } from '~/core/sharp'
import { i18n } from '~/i18n'
import { Log } from '~/utils/Log'
import { Config, Watcher } from '.'

export class Global {
  private static _rootpaths: string[]

  static context: ExtensionContext
  static theme: Theme = 'dark'
  static sharp: TSharp
  static compressor: Compressor

  // events
  private static _onDidChangeRootPath: EventEmitter<string[]> = new EventEmitter()

  static readonly onDidChangeRootPath: Event<string[]> = Global._onDidChangeRootPath.event

  static async init(context: ExtensionContext) {
    this.context = context
    Watcher.init()
    await this.installSharp()
    this.updateTheme()
    context.subscriptions.push(workspace.onDidChangeWorkspaceFolders(() => this.updateRootPath()))
    // context.subscriptions.push(workspace.onDidChangeConfiguration((e) => this.update(e)))
    await this.updateRootPath()
  }

  static get rootpaths() {
    return this._rootpaths
  }

  static async updateRootPath(_rootpaths?: string[]) {
    let rootpaths = _rootpaths?.length ? _rootpaths : Config.file_root
    if (!rootpaths && workspace.rootPath) {
      rootpaths = [workspace.rootPath]
    }
    if (rootpaths?.length) {
      Log.info(`💼 Workspace root changed to ${rootpaths.join(',')}`)
      this._rootpaths = rootpaths
      this._onDidChangeRootPath.fire(this._rootpaths)
    }
  }

  static updateTheme() {
    switch (window.activeColorTheme.kind) {
      case 1:
        this.theme = 'light'
        break
      case 2:
        this.theme = 'dark'
        break
      default:
        this.theme = 'dark'
        break
    }
  }

  static async installSharp() {
    const installer = new Installer(this.context)

    installer.event
      .on('install-success', (e) => {
        Log.info('Sharp creation success')
        Global.sharp = e
        Global.compressor = new Compressor()
      })
      .on('install-fail', () => {
        Log.error(i18n.t('prompt.compressor_init_fail'), true)
      })

    await installer.run()
  }
}
