import type * as vscode from 'vscode'
import { flatten } from 'es-toolkit'
import commandsModules from '~/commands'
import { version } from '../package.json'
import { Global } from './core/global'
import { VscodeSettings } from './core/vscode-setting/vscode-settings'
import { i18n } from './i18n'
import { Channel } from './utils/node/channel'

export function activate(ctx: vscode.ExtensionContext) {
  Channel.info(`Activated, v${version}`)

  Global.context = ctx

  const settings = VscodeSettings.init(ctx)

  i18n.init(ctx, settings.language)

  Global.init(ctx, settings)

  const modules = [commandsModules]

  const disposables = flatten(modules.map(m => m(ctx)))

  disposables.forEach(d => ctx.subscriptions.push(d))
}

export function deactivate() {
  Channel.info('Deactivated')
}
