import { type Webview } from 'vscode'
import { Channel } from '~/utils/Channel'
import { type MessageType, VscodeMessageCenter } from './MessageCenter'
import { CmdToWebview } from './cmd'

export class WebviewMessageCenter {
  static _webview: Webview | undefined

  static slientMessages: string[] = [CmdToWebview.webview_callback]

  static init(webview: Webview) {
    this._webview = webview
  }

  static postMessage<T extends keyof typeof CmdToWebview>(message: MessageType<any, T>) {
    // Filter some message
    if (!this.slientMessages.includes(message.cmd)) {
      Channel.debug(`Post message to webview: ${message.cmd}`)
    }
    if (this._webview) {
      this._webview.postMessage(message)
    }
  }

  static async handleMessages(message: MessageType) {
    const handler: (data: Record<string, any>, webview: Webview) => Thenable<any> = VscodeMessageCenter[message.cmd]

    if (handler) {
      const data = await handler(message.data, this._webview as Webview)
      this.postMessage({ cmd: CmdToWebview.webview_callback, callbackId: message.callbackId, data })
    } else {
      Channel.error(`Handler function "${message.cmd}" doesn't exist!`)
    }
  }
}
