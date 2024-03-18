import { commands } from 'vscode'
import { type ExtensionModule } from '~/module'
import { Channel } from '~/utils/Channel'
import { Commands } from '.'

export default <ExtensionModule>function () {
  async function showChannel() {
    Channel.show()
  }

  return [commands.registerCommand(Commands.show_channel, showChannel)]
}
