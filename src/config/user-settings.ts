import { commands, window, workspace } from 'vscode'
import { i18n } from '@/i18n'
import { Log } from '@/utils/Log'

export class UserSettings {
  static watch() {
    const disposable = workspace.onDidChangeConfiguration((event) => {
      const reloadConfigList = ['image-manager.compress']
      const affected = reloadConfigList.some((item) => event.affectsConfiguration(item))

      // const existPanel = ImageManagerPanel.currentPanel?.panel

      if (affected) {
        window.showInformationMessage(i18n.t('prompt.reload_tip'), 'Reload').then((res) => {
          if (res === 'Reload') {
            commands.executeCommand('workbench.action.reloadWindow')
          }
        })
      }
    })

    Log.info(`Extension Config: ${JSON.stringify(workspace.getConfiguration('image-manager'))}`)

    return disposable
  }
}
