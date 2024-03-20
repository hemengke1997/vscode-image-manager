import { ConfigurationTarget, commands, window } from 'vscode'
import { Config } from '~/core'
import { ConfigKey } from '~/core/config/common'
import { i18n } from '~/i18n'
import { type ExtensionModule } from '~/module'
import { Commands } from '.'

export default <ExtensionModule>function () {
  async function enableMirror() {
    if (!Config.mirror_enabled) {
      await Config.updateConfig(ConfigKey.mirror_enabled, true, ConfigurationTarget.Global)

      const restart = i18n.t('prompt.reload_now')
      const r = await window.showInformationMessage(i18n.t('prompt.mirror_enabled'), restart)
      if (r === restart) {
        commands.executeCommand('workbench.action.reloadWindow')
      }
    } else {
      window.showInformationMessage(i18n.t('prompt.mirror_already_enabled'))
    }
  }

  return [commands.registerCommand(Commands.enable_mirror, enableMirror)]
}
