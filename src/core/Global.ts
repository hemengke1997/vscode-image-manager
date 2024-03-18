import { lowerCase } from '@minko-fe/lodash-pro'
import { type Event, EventEmitter, type ExtensionContext, ExtensionMode, env, window, workspace } from 'vscode'
import { Compressor } from '~/core/compress/Compressor'
import { Installer } from '~/core/sharp'
import { i18n } from '~/i18n'
import { FALLBACK_LANGUAGE } from '~/meta'
import { Channel } from '~/utils/Channel'
import { Config, Watcher, WorkspaceState } from '.'

export class Global {
  private static _rootpaths: string[]

  static context: ExtensionContext
  static theme: Theme = 'dark'
  static language: Language = FALLBACK_LANGUAGE
  static sharp: TSharp
  static compressor: Compressor
  static isProgrammaticChangeConfig = false

  // events
  private static _onDidChangeRootPath: EventEmitter<string[]> = new EventEmitter()

  static readonly onDidChangeRootPath: Event<string[]> = Global._onDidChangeRootPath.event

  static async init(context: ExtensionContext) {
    this.context = context

    Watcher.init()
    WorkspaceState.init()

    await this.installSharp()

    this._updateTheme()
    this._updateLanguage()

    context.subscriptions.push(workspace.onDidChangeWorkspaceFolders(() => this.updateRootPath()))
    context.subscriptions.push(window.onDidChangeActiveColorTheme(() => this._updateTheme()))
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
      Channel.info(`💼 Workspace root changed to ${rootpaths.join(',')}`)
      this._rootpaths = rootpaths
      this._onDidChangeRootPath.fire(this._rootpaths)
    }
  }

  static _updateTheme() {
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

  static _updateLanguage() {
    switch (lowerCase(env.language)) {
      case 'en':
        this.language = 'en'
        break
      case 'zh-cn':
        this.language = 'zh-CN'
        break
      default:
        this.language = FALLBACK_LANGUAGE
        break
    }
  }

  static async installSharp() {
    const installer = new Installer(this.context)

    installer.event
      .on('install-success', (e) => {
        Channel.info('Sharp installed')
        Global.sharp = e
        Global.compressor = new Compressor()
      })
      .on('install-fail', () => {
        Channel.error(i18n.t('prompt.compressor_init_fail'), true)
      })

    await installer.run()
  }

  static isDevelopment() {
    return this.context.extensionMode === ExtensionMode.Development
  }

  static isProduction() {
    return this.context.extensionMode === ExtensionMode.Production
  }
}
