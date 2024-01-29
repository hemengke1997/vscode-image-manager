import { commands, window, workspace } from 'vscode'
import { Log } from '@/utils/Log'

export function watchConfig() {
  workspace.onDidChangeConfiguration((event) => {
    const configList = ['image-manager', 'image-manager.compress']
    const affected = configList.some((item) => event.affectsConfiguration(item))

    // const existPanel = ImageManagerPanel.currentPanel?.panel

    if (affected) {
      window.showInformationMessage('Config changed. Please reload', 'Reload').then((res) => {
        if (res === 'Reload') {
          commands.executeCommand('workbench.action.reloadWindow')
        }
      })
    }
  })

  Log.info(`Extension Config: ${JSON.stringify(workspace.getConfiguration('image-manager'))}`)
}
