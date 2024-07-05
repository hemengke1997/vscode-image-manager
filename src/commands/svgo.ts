import { commands } from 'vscode'
import { Svgo } from '~/core'
import { VscodeMessageCenter } from '~/message'
import { CmdToVscode } from '~/message/cmd'
import { type ExtensionModule } from '~/module'
import { Commands } from './commands'

export default <ExtensionModule>function () {
  // 配置svgo
  // 打开 svgo.config.js 文件
  // TODO：暂时不考虑系统缓存不可用的情况
  async function configureSvgo() {
    VscodeMessageCenter[CmdToVscode.open_file_in_text_editor]({ filePath: Svgo.configPath })
  }

  return [commands.registerCommand(Commands.configure_svgo, configureSvgo)]
}
