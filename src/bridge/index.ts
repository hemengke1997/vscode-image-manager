import { type Webview } from 'vscode'
import { webviewMessageListener } from './VscodeListener'
import { CallbackFromVscode, CmdToVscode } from './constant'

export type MessageType = {
  msgId: string
  cmd: string
  postTime: string
  callbackId: string
  data: any
}

export function invokeCallback(message: MessageType, webview: Webview, data: any) {
  if (webview) {
    webview.postMessage({ cmd: CallbackFromVscode, callbackId: message.callbackId, data })
  }
}

export const webviewBridge: Map<string, (message: MessageType, webview: Webview) => any> = new Map([
  [
    CmdToVscode.GET_ALL_IMAGES,
    async (message: MessageType, webview: Webview) => {
      const data = await webviewMessageListener.getAllImgs(webview)
      invokeCallback(message, webview, data)
    },
  ],
  [
    CmdToVscode.GET_IMAGE_DIMENSIONS,
    (message: MessageType, webview: Webview) => {
      const data = webviewMessageListener.getImageDimensions(message.data.filePath)
      invokeCallback(message, webview, data)
    },
  ],
])
