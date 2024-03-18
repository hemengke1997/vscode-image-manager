import { commands } from 'vscode'
import { WorkspaceState } from '~/core/persist'
import { CmdToWebview } from '~/message/cmd'
import { type ExtensionModule } from '~/module'
import { Commands } from '.'

export default <ExtensionModule>function () {
  async function resetSettings() {
    await WorkspaceState.clear()
    WorkspaceState.webview?.postMessage({
      cmd: CmdToWebview.update_workspaceState,
    })
  }

  return [commands.registerCommand(Commands.reset_settings, resetSettings)]
}
