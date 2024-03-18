import { type OutputChannel, window } from 'vscode'
import { Global } from '~/core'
import { EXT_NAME } from '~/meta'

export class Channel {
  private static _channel: OutputChannel

  static get outputChannel(): OutputChannel {
    if (!this._channel) {
      this._channel = window.createOutputChannel(EXT_NAME)
    }
    return this._channel
  }

  static raw(...values: any[]) {
    this.outputChannel.appendLine(values.map((i) => i.toString()).join(' '))
  }

  static info(message: string, prompt = false, indent = 0) {
    if (prompt) {
      window.showInformationMessage(`${message}`)
    }
    this.outputChannel.appendLine(`${'\t'.repeat(indent)}[${EXT_NAME}] ${message}`)
  }

  static warn(message: string, prompt = false, indent = 0) {
    if (prompt) {
      window.showWarningMessage(message)
    }
    Channel.info(`⚠ WARN: ${message}`, prompt, indent)
  }

  static async error(err: Error | string | any = {}, prompt = false, indent = 0) {
    if (typeof err !== 'string') {
      const messages = [err.message, err.response?.data, err.stack, err.toJSON?.()].filter(Boolean).join('\n')
      Channel.info(`🐛 ERROR: ${err.name}: ${messages}`, false, indent)
    }

    if (prompt) {
      const openOutputButton = 'Show logs'
      const message = typeof err === 'string' ? err : `Error: ${err.toString()}`

      const result = await window.showErrorMessage(message, openOutputButton)
      if (result === openOutputButton) this.show()
    }
  }

  static debug(message: string, indent = 0) {
    if (Global.isDevelopment()) {
      this.info(message, false, indent)
    }
  }

  static show() {
    this._channel.show()
  }

  static divider() {
    this.outputChannel.appendLine('\n――――――\n')
  }
}