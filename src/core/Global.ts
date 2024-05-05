import { type Event, EventEmitter, type ExtensionContext, ExtensionMode, workspace } from 'vscode'
import { Compressor, FormatConverter } from '~/core/operator'
import { Installer } from '~/core/sharp'
import { i18n } from '~/i18n'
import { EXT_NAMESPACE } from '~/meta'
import { Channel } from '~/utils/Channel'
import { Config, Watcher, WorkspaceState } from '.'
import { ConfigKey, type VscodeConfigType } from './config/common'

export class Global {
  private static _rootpaths: string[]

  /**
   * extension context
   */
  static context: ExtensionContext
  /**
   * vscode theme
   */
  static vscodeTheme: Theme
  /**
   * vscode language
   */
  static vscodeLanguage: Language
  /**
   * vscode reduce motion
   */
  static vscodeReduceMotion: ReduceMotion
  /**
   * sharp
   */
  static sharp: TSharp
  /**
   * compressor
   */
  static compressor: Compressor
  /**
   * format converter
   */
  static formatConverter: FormatConverter
  /**
   * is programmatic change config
   */
  static isProgrammaticChangeConfig = false

  // events
  private static _onDidChangeRootPath: EventEmitter<string[]> = new EventEmitter()

  static readonly onDidChangeRootPath: Event<string[]> = Global._onDidChangeRootPath.event

  static async init(context: ExtensionContext, settings: VscodeConfigType) {
    this.context = context

    Watcher.init()
    WorkspaceState.init()

    this.vscodeTheme = settings.theme
    this.vscodeLanguage = settings.language
    this.vscodeReduceMotion = settings.reduceMotion

    await this.installSharp()

    context.subscriptions.push(workspace.onDidChangeWorkspaceFolders(() => this.updateRootPath()))
    context.subscriptions.push(
      workspace.onDidChangeConfiguration((e) => {
        for (const config of [ConfigKey.compression, ConfigKey.conversion]) {
          const key = `${EXT_NAMESPACE}.${config}`

          if (e.affectsConfiguration(key)) {
            this.initOperators()
            Channel.info(`[Operators] Config "${key}" changed`)
            break
          }
        }
      }),
    )
    await this.updateRootPath()
  }

  static get rootpaths(): string[] {
    return this._rootpaths || []
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

  static initOperators() {
    // Get compresstion config from vscode
    Global.compressor = new Compressor(Config.compression)
    // Get format converter config from vscode
    Global.formatConverter = new FormatConverter(Config.conversion)
  }

  static async installSharp() {
    const installer = new Installer(this.context)

    installer.event
      .on('install-success', (e) => {
        Global.sharp = e
        this.initOperators()
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
