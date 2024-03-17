import { commands } from 'vscode'
import { WorkspaceState } from '~/core/persist'
import { type ExtensionModule } from '~/module'
import { Commands } from '.'

export default <ExtensionModule>function () {
  async function resetSettings() {
    await WorkspaceState.clear()
  }

  return [commands.registerCommand(Commands.reset_settings, resetSettings)]
}
