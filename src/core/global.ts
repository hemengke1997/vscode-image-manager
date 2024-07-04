import { type Event, EventEmitter, type ExtensionContext, ExtensionMode, commands, window, workspace } from 'vscode'
import { Commands } from '~/commands'
import { Compressor, FormatConverter } from '~/core/operator'
import { Installer } from '~/core/sharp'
import { i18n } from '~/i18n'
import { EXT_NAMESPACE } from '~/meta'
import { AbortError, TimeoutError } from '~/utils/abort-promise'
import { Channel } from '~/utils/channel'
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

  /**
   * sharp 安装器
   */
  static installer: Installer

  /**
   * events
   */
  private static _onDidChangeRootPath: EventEmitter<string[]> = new EventEmitter()

  static readonly onDidChangeRootPath: Event<string[]> = Global._onDidChangeRootPath.event

  static init(context: ExtensionContext, settings: VscodeConfigType) {
    this.context = context

    Watcher.init()
    WorkspaceState.init()
    this.initSharp()

    this.vscodeTheme = settings.theme
    this.vscodeLanguage = settings.language
    this.vscodeReduceMotion = settings.reduceMotion

    context.subscriptions.push(workspace.onDidChangeWorkspaceFolders(() => this.updateRootPath()))
    context.subscriptions.push(
      workspace.onDidChangeConfiguration((e) => {
        for (const config of [ConfigKey.compression, ConfigKey.conversion]) {
          const key = `${EXT_NAMESPACE}.${config}`

          if (e.affectsConfiguration(key)) {
            this.initOperators()
            Channel.info(i18n.t('core.config_changed', key))
            break
          }
        }
      }),
    )
    this.updateRootPath()
  }

  static get rootpaths(): string[] {
    return this._rootpaths || []
  }

  static updateRootPath(_rootpaths?: string[]) {
    let rootpaths = _rootpaths?.length ? _rootpaths : Config.file_root
    if (!rootpaths && workspace.rootPath) {
      rootpaths = [workspace.rootPath]
    }
    if (rootpaths?.length) {
      Channel.info(i18n.t('core.workspace_changed', rootpaths.join(',')))
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

  static initSharp() {
    this.installer = new Installer(this.context, {
      timeout: 30 * 1000, // 30s
    })
  }

  static async installSharp() {
    return new Promise<boolean>(async (resolve, reject) => {
      this.installer.event
        .on('install-success', (e) => {
          Channel.info(i18n.t('prompt.deps_init_success'))
          Global.sharp = e
          this.initOperators()
        })
        .on('install-fail', async (e) => {
          reject(e)
          if (e instanceof TimeoutError) {
            const SELECT_MIRROR = i18n.t('pkg.cmd.select_mirror')
            const result = await window.showErrorMessage(i18n.t('prompt.deps_init_timeout'), SELECT_MIRROR)
            if (result === SELECT_MIRROR) {
              commands.executeCommand(Commands.select_mirror)
            }
          } else if (e instanceof AbortError) {
            window.showErrorMessage(i18n.t('prompt.deps_init_aborted'))
          } else {
            Channel.error(i18n.t('prompt.compressor_init_fail'), true)
          }
          reject(e)
        })

      await this.installer.run()
      resolve(true)
    })
  }

  static isDevelopment() {
    return this.context.extensionMode === ExtensionMode.Development
  }

  static isProduction() {
    return this.context.extensionMode === ExtensionMode.Production
  }
}
