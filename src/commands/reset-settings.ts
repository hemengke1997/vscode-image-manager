import { commands, type QuickPickItem, window } from 'vscode'
import { Config } from '~/core/config/config'
import { Global } from '~/core/global'
import { WorkspaceState } from '~/core/persist/workspace/workspace-state'
import { i18n } from '~/i18n'
import { CmdToWebview } from '~/message/cmd'
import { type ExtensionModule } from '~/module'
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

        Global.imageManagerPanels.forEach(({ messageCenter }) => {
          messageCenter.postMessage({
            cmd: CmdToWebview.update_workspaceState,
            data: undefined,
          })
        })

        // 重置configuration
        try {
          Global.imageManagerPanels.forEach((panel) => {
            panel.isProgrammaticChangeConfig = true
          })
          await Config.clearAll()
          Global.imageManagerPanels.forEach((panel) => {
            panel.reloadWebview()
          })
        } finally {
          Global.imageManagerPanels.forEach((panel) => {
            panel.isProgrammaticChangeConfig = false
          })
        }
        window.showInformationMessage(i18n.t('prompt.reset_settings_success'))
      } catch {
        window.showErrorMessage(i18n.t('prompt.reset_settings_fail'))
      }
    }
  }

  return [commands.registerCommand(Commands.reset_settings, resetSettings)]
}
