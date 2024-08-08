import { commands, ConfigurationTarget, type QuickPickItem, window } from 'vscode'
import { Config } from '~/core'
import { ConfigKey } from '~/core/config/common'
import { i18n } from '~/i18n'
import { locales } from '~/meta'
import { type ExtensionModule } from '~/module'
import { Commands } from './commands'

export default <ExtensionModule>function () {
  async function selectLanguage() {
    const previousLanguage = Config.appearance_language

    const language = await window.showQuickPick(
      locales.map(
        (t) =>
          ({
            label: t.label,
            description: previousLanguage === t.key ? i18n.t('prompt.current_language') : '',
          }) as QuickPickItem,
      ),
      { placeHolder: i18n.t('pkg.cmd.select_language') },
    )

    if (language) {
      const selected = locales.find((t) => t.label === language.label)?.key
      await Config.updateConfig(ConfigKey.appearance_language, selected, ConfigurationTarget.Global)
      window.showInformationMessage(i18n.t('prompt.config_changed_tip'))
    }
  }

  return [commands.registerCommand(Commands.select_language, selectLanguage)]
}
