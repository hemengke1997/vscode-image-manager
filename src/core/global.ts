import { type ExtensionContext, ExtensionMode, window, workspace } from 'vscode'
import { i18n } from '~/i18n'
import { EXT_NAMESPACE } from '~/meta'
import { slashPath } from '~/utils'
import { AbortError, TimeoutError } from '~/utils/abort-promise'
import logger from '~/utils/logger'
import { Channel } from '~/utils/node/channel'
import { type ImageManagerPanel } from '~/webview/panel'
import { ConfigKey, type VscodeConfigType } from './config/common'
import { Installer, InstallEvent } from './sharp/installer'

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
  static sharp: TSharp
  /**
   * sharp 安装器
   */
  static installer: Installer | undefined

  static init(context: ExtensionContext, settings: VscodeConfigType) {
    Channel.debug('Global init')

    this.vscodeTheme = settings.theme
    this.vscodeLanguage = settings.language
    this.vscodeReduceMotion = settings.reduceMotion

    Global.installer = new Installer({
      timeout: 30 * 1000, // 30s
    })

    context.subscriptions.push(
      workspace.onDidChangeConfiguration((e) => {
        for (const config of Object.values(ConfigKey)) {
          const key = `${EXT_NAMESPACE}.${config}`

          if (e.affectsConfiguration(key)) {
            Channel.info(i18n.t('core.config_changed', key))
            break
          }
        }
      }),
    )
  }

  static resolveRootPath(rootpaths?: string[]) {
    logger.debug('resolveRootPath: ', rootpaths)
    if (!rootpaths) {
      if (workspace.rootPath) {
        rootpaths = [workspace.rootPath]
      }
      if (workspace.workspaceFolders) {
        rootpaths = workspace.workspaceFolders.map((f) => f.uri.fsPath)
      }
    }

    if (rootpaths?.length) {
      rootpaths = rootpaths.map(slashPath)

      Channel.info(i18n.t('core.workspace_changed', rootpaths.join(',')))
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

  static isDevelopment = () => {
    return this.context.extensionMode === ExtensionMode.Development
  }

  static isProduction = () => {
    return this.context.extensionMode === ExtensionMode.Production
  }
}
