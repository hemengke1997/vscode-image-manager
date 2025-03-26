import { type ExtensionContext, ExtensionMode, window, workspace } from 'vscode'
import { i18n } from '~/i18n'
import { EXT_NAMESPACE } from '~/meta'
import { normalizePath } from '~/utils'
import { AbortError, TimeoutError } from '~/utils/abort-promise'
import { Channel } from '~/utils/channel'
import { type ImageManagerPanel } from '~/webview/panel'
import { ConfigKey, type VscodeConfigType } from './config/common'
import { Config } from './config/config'
import { type Installer, InstallEvent } from './sharp/installer'

export class Global {
  static imageManagerPanels: ImageManagerPanel[] = []
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
   * 如果安装依赖失败，则为 undefined
   */
  static sharp: TSharp | undefined
  /**
   * sharp 安装器
   */
  static installer: Installer | undefined

  static init(context: ExtensionContext, settings: VscodeConfigType) {
    this.context = context

    this.vscodeTheme = settings.theme
    this.vscodeLanguage = settings.language
    this.vscodeReduceMotion = settings.reduceMotion

    context.subscriptions.push(
      workspace.onDidChangeConfiguration((e) => {
        for (const config of [ConfigKey.compression, ConfigKey.conversion]) {
          const key = `${EXT_NAMESPACE}.${config}`

          if (e.affectsConfiguration(key)) {
            Channel.info(i18n.t('core.config_changed', key))
            break
          }
        }
      }),
    )
  }

  static resolveRootPath(_rootpaths?: string[]) {
    let rootpaths = _rootpaths?.length ? _rootpaths : Config.file_root
    if (!rootpaths) {
      if (workspace.rootPath) {
        rootpaths = [workspace.rootPath]
      }
      if (workspace.workspaceFolders) {
        rootpaths = workspace.workspaceFolders.map((f) => f.uri.fsPath)
      }
    }

    if (rootpaths?.length) {
      Channel.info(i18n.t('core.workspace_changed', rootpaths.join(',')))
      rootpaths = rootpaths.map(normalizePath)
    } else {
      rootpaths = []
    }
    return rootpaths
  }

  static async installSharp() {
    if (!this.installer) {
      throw new Error('Installer not initialized')
    }
    return new Promise<boolean>(async (resolve, reject) => {
      this.installer!.event.on(InstallEvent.success, (sharp) => {
        Channel.info(i18n.t('prompt.deps_init_success'))
        Global.sharp = sharp
      }).on(InstallEvent.fail, async (e) => {
        if (e instanceof TimeoutError) {
          window.showErrorMessage(i18n.t('prompt.deps_init_timeout'))
        } else if (e instanceof AbortError) {
          Channel.warn(i18n.t('prompt.deps_init_aborted'), true)
        }
        reject(e)
      })

      await this.installer!.run()
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
