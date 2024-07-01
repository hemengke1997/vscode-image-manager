import { type Webview } from 'vscode'
import { i18n } from '~/i18n'
import { Channel } from '~/utils/channel'
import { CmdToWebview } from './cmd'
import { type MessageType, VscodeMessageCenter } from './message-center'

export class WebviewMessageCenter {
  static _webview: Webview | undefined

  static slientMessages: string[] = [CmdToWebview.webview_callback]

  static init(webview: Webview) {
    this._webview = webview
  }

  static postMessage<T extends keyof typeof CmdToWebview>(message: MessageType<any, T>) {
    // Filter some message
    if (!this.slientMessages.includes(message.cmd)) {
      Channel.debug(`${i18n.t('core.post_message_to_webview')}: ${message.cmd}`)
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
      Channel.error(i18n.t('core.handler_fn_not_exist', message.cmd))
    }
  }
}
