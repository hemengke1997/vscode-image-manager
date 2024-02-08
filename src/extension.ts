import type * as vscode from 'vscode'
import { version } from '../package.json'
import { Context } from './Context'
import { UserSettings } from './config/user-settings'
import { i18n } from './i18n'
import { installOperator } from './operator'
import { openPanelCmd } from './panel/command'
import { Log } from './utils/Log'

export function activate(context: vscode.ExtensionContext) {
  Log.info(`🈶 Activated, v${version}`)

  const ctx = Context.init(context)

  installOperator(ctx)
  i18n.init(ctx)

  const disposables = [[openPanelCmd].map((cmd) => cmd(ctx)), UserSettings.watch()]

  disposables
    .flat()
    .filter(Boolean)
    .forEach((d) => context.subscriptions.push(d!))
}

export function deactivate() {
  Log.info('🈚 Deactivated')
}
