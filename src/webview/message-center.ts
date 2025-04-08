import { i18n } from '~/i18n'
import { CmdToWebview } from '~/message/cmd'
import { type MessageType, VscodeMessageFactory } from '~/message/message-factory'
import { type CmdToWebviewMessage } from '~/message/webview-message-factory'
import { Channel } from '~/utils/node/channel'
import { type ImageManagerPanel } from '~/webview/panel'

export class MessageCenter {
  constructor(public imageManagerPanel: ImageManagerPanel) {}

  slientMessages: string[] = [CmdToWebview.webview_callback]

  /**
   * 向webview发送消息
   * @param message
   */
  postMessage<T extends keyof CmdToWebviewMessage>(message: MessageType<CmdToWebviewMessage[T], T>) {
    // Filter some message
    if (!this.slientMessages.includes(message.cmd)) {
      Channel.debug(`${i18n.t('core.post_message_to_webview')}: ${message.cmd}`)
    }

    this.imageManagerPanel.panel.webview.postMessage(message)
  }

  /**
   * 处理webview发送给vscode的消息
   * @param message
   */
  async handleMessages(message: MessageType) {
    const handler: (data: Record<string, any>, panel: ImageManagerPanel) => Thenable<any> = VscodeMessageFactory[
      message.cmd
    ] as any

    if (handler) {
      // 执行对应消息的处理函数
      const data = await handler(message.data, this.imageManagerPanel)

      // 如果消息有回调id，则返回数据给webview
      this.postMessage({ cmd: CmdToWebview.webview_callback, callbackId: message.callbackId, data })
    } else {
      Channel.error(i18n.t('core.handler_fn_not_exist', message.cmd))
    }
  }
}
