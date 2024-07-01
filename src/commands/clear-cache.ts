import { commands, window } from 'vscode'
import { Global } from '~/core'
import { i18n } from '~/i18n'
import { type ExtensionModule } from '~/module'
import { Commands } from './commands'

export default <ExtensionModule>function () {
  async function clearCache() {
    try {
      await Global.installer.clearCaches()
      const RESTART = i18n.t('prompt.reload_now')
      const r = await window.showInformationMessage(i18n.t('prompt.clear_cache_success'), RESTART)
      if (r === RESTART) {
        commands.executeCommand('workbench.action.reloadWindow')
      }
    } catch {
      window.showErrorMessage(i18n.t('prompt.cache_not_found'))
    }
  }

  return [commands.registerCommand(Commands.clear_cache, clearCache)]
}
