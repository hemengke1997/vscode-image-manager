import type { ExtensionModule } from '~/module'
import { commands } from 'vscode'
import { Channel } from '~/utils/node/channel'
import { Commands } from '.'

export default <ExtensionModule> function () {
  async function showChannel() {
    Channel.show()
  }

  return [commands.registerCommand(Commands.show_channel, showChannel)]
}
