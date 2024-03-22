import { type ExtensionContext, window } from 'vscode'
import { type VscodeConfigType } from '../config/common'
import { VscodeLanguage } from './Language'
import { VscodeTheme } from './Theme'

export class VscodeSettings {
  static init(ctx: ExtensionContext): VscodeConfigType {
    ctx.subscriptions.push(window.onDidChangeActiveColorTheme(() => VscodeTheme.init()))

    VscodeLanguage.init()
    VscodeTheme.init()
    return {
      language: VscodeLanguage.vscodeLanguage,
      theme: VscodeTheme.vscodeTheme,
    }
  }
}
