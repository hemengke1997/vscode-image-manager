import { type Webview } from 'vscode'
import { messageHandler } from './messageHandler'
import { CmdToVscode } from './shared'

export type MessageType = {
  msgId: string
  cmd: string
  postTime: string
  callbackId: string
  data: any
}

export const vscodeMessageCenter: Record<
  string,
  (params: { message: MessageType; webview: Webview }) => Promise<any> | any
> = {
  [CmdToVscode.GET_ALL_IMAGES]: async ({ webview }) => {
    const data = await messageHandler.getAllImgs(webview)
    return data
  },
  [CmdToVscode.GET_IMAGE_DIMENSIONS]: ({ message }) => {
    const data = messageHandler.getImageDimensions(message.data.filePath)
    return data
  },
  [CmdToVscode.GET_EXT_CONFIG]: () => {
    const data = messageHandler.getExtConfig()
    return data
  },
}
