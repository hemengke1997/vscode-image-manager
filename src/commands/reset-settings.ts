import { commands, type QuickPickItem, window } from 'vscode'
import { Config, Global } from '~/core'
import { WorkspaceState } from '~/core/persist'
import { i18n } from '~/i18n'
import { CmdToWebview } from '~/message/cmd'
import { type ExtensionModule } from '~/module'
import { ImageManagerPanel } from '~/webview/panel'
import { Commands } from '.'

export default <ExtensionModule>function () {
  async function resetSettings() {
    const options: QuickPickItem[] = [
      { label: `$(check) ${i18n.t('prompt.yes')}` },
      { label: `$(x) ${i18n.t('prompt.no')}` },
    ]
    const result = await window.showQuickPick(options, {
      placeHolder: i18n.t('prompt.reset_settings_tip'),
      canPickMany: false,
    })

    if (result?.label === options[0].label) {
      try {
        // 清除workspaceState
        await WorkspaceState.clear()
        await WorkspaceState.clear_unused()
        WorkspaceState.webview?.postMessage({
          cmd: CmdToWebview.update_workspaceState,
        })

        // 重置configuration
        try {
          Global.isProgrammaticChangeConfig = true
          await Config.clearAll()
          ImageManagerPanel.reloadWebview()
        } finally {
          Global.isProgrammaticChangeConfig = false
        }
        window.showInformationMessage(i18n.t('prompt.reset_settings_success'))
      } catch {
        window.showErrorMessage(i18n.t('prompt.reset_settings_fail'))
      }
    }
  }

  return [commands.registerCommand(Commands.reset_settings, resetSettings)]
}
