import { commands } from 'vscode'
import { Config, Global } from '~/core'
import { WorkspaceState } from '~/core/persist'
import { CmdToWebview } from '~/message/cmd'
import { type ExtensionModule } from '~/module'
import { ImageManagerPanel } from '~/webview/Panel'
import { Commands } from '.'

export default <ExtensionModule>function () {
  async function resetSettings() {
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
  }

  return [commands.registerCommand(Commands.reset_settings, resetSettings)]
}
