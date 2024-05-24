import { destrUtil, isUndefined } from '@minko-fe/lodash-pro'
import fs from 'node:fs'
import path from 'node:path'
import { type ExtensionContext } from 'vscode'
import { Config, Global } from './core'
import { FALLBACK_LANGUAGE } from './meta'
import { intelligentPick } from './utils/intelligent-pick'

export class i18n {
  static messages: Record<string, string> = {}

  static init(ctx: ExtensionContext) {
    const extensionPath = ctx.extensionUri.fsPath
    const language = intelligentPick(Config.appearance_language, Global.vscodeLanguage, 'auto').toLowerCase()

    let name = language === FALLBACK_LANGUAGE ? 'package.nls.json' : `package.nls.${language}.json`
    if (!fs.existsSync(path.join(extensionPath, name))) {
      name = 'package.nls.json' // locale not exist, fallback to English
    }

    this.messages = destrUtil.destr<AnyObject>(fs.readFileSync(path.join(extensionPath, name), 'utf-8'))
  }

  static format(str: string, args: any[]) {
    return str.replace(/{(\d+)}/g, (match, number) => {
      return !isUndefined(args[number]) ? args[number].toString() : match
    })
  }

  static t(key: string, ...args: any[]) {
    let text = this.messages[key] || ''

    if (args && args.length) {
      text = this.format(text, args)
    }

    return text
  }
}
