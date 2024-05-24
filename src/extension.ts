import type * as vscode from 'vscode'
import { flatten } from '@minko-fe/lodash-pro'
import commandsModules from '~/commands'
import { version } from '../package.json'
import { Global, VscodeSettings } from './core'
import { i18n } from './i18n'
import { Channel } from './utils/Channel'

export async function activate(ctx: vscode.ExtensionContext) {
  Channel.info(`Activated, v${version}`)

  const settings = VscodeSettings.init(ctx)

  i18n.init(ctx)

  await Global.init(ctx, settings)

  const modules = [commandsModules]

  const disposables = flatten(modules.map((m) => m(ctx)))

  disposables.forEach((d) => ctx.subscriptions.push(d))
}

export function deactivate() {
  Channel.info('Deactivated')
}
