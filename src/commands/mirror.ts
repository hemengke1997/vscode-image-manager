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

  // 选择内置镜像
  async function selectMirror() {
    const previousMirrorUrl = Config.mirror_url

    const mirrors = [
      {
        label: 'cnpm',
        description: 'https://npmmirror.com/mirrors/sharp-libvips',
      },
      {
        label: 'cnpm - binary',
        description: 'https://registry.npmmirror.com/-/binary/sharp-libvips',
      },
      {
        label: 'cnpm - cdn',
        description: 'https://cdn.npmmirror.com/binaries/sharp-libvips',
      },
    ]

    const mirror = await window.showQuickPick(
      mirrors.map((t) => ({
        label: t.label,
      })),
      {
        placeHolder: i18n.t('prompt.select_mirror'),
      },
    )

    if (mirror) {
      const selected = mirrors.find((t) => t.label === mirror.label)?.description
      await Promise.all([
        Config.updateConfig(ConfigKey.mirror_url, selected, ConfigurationTarget.Global),
        Config.updateConfig(ConfigKey.mirror_enabled, true, ConfigurationTarget.Global),
      ])

      if (previousMirrorUrl !== selected) {
        // updated
        const restart = i18n.t('prompt.reload_now')

        await window.showInformationMessage(i18n.t('prompt.mirror_selected', mirror.label), restart).then((r) => {
          if (r === restart) {
            commands.executeCommand('workbench.action.reloadWindow')
          }
        })
      }
    }
  }

  return [
    commands.registerCommand(Commands.enable_mirror, enableMirror),
    commands.registerCommand(Commands.select_mirror, selectMirror),
  ]
}
