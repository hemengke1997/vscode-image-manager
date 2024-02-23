import type * as vscode from 'vscode'
import { flatten } from '@minko-fe/lodash-pro'
import commandsModules from '~/commands'
import { version } from '../package.json'
import { Global } from './core'
import { i18n } from './i18n'
import { Log } from './utils/Log'

export async function activate(ctx: vscode.ExtensionContext) {
  Log.info(`🈶 Activated, v${version}`)

  i18n.init(ctx)
  await Global.init(ctx)

  const modules = [commandsModules]

  const disposables = flatten(modules.map((m) => m(ctx)))

  disposables.forEach((d) => ctx.subscriptions.push(d))
}

export function deactivate() {
  Log.info('🈚 Deactivated')
}
