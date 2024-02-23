import type SharpNS from 'sharp'
import { execaSync } from 'execa'
import fs from 'fs-extra'
import path from 'node:path'
import { Emitter } from 'strict-event-emitter'
import * as vscode from 'vscode'
import { Log } from '~/utils/Log'

type Events = {
  'install-success': [typeof SharpNS]
  'install-fail': []
}

const SHARP_LIB_RESOLVE_PATH = './lib/install/sharp.cjs'

export class Installer {
  private _cwd: string
  event: Emitter<Events> = new Emitter()

  constructor(ctx: vscode.ExtensionContext) {
    this._cwd = ctx.extensionUri.fsPath
    Log.info(`Extension cwd: ${this._cwd}`)
  }

  run() {
    try {
      if (!this._isInstalled()) {
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
        statusBarItem.text = 'Image Manager Initializing...'
        Log.info('Sharp creating...')
        statusBarItem.show()
        this._install()
        statusBarItem.hide()
      }
      this.event.emit('install-success', this._loadSharp())
    } catch (error) {
      Log.error(`Sharp binary file creation error: ${error}`)
      this.event.emit('install-fail')
    }
    return this
  }

  private _isInstalled() {
    const dirPath = path.resolve(this._cwd, 'dist/lib/build/Release')
    if (!fs.existsSync(dirPath)) {
      return false
    }
    return fs.readdirSync(dirPath).some((item) => item.endsWith('.node'))
  }

  private _install() {
    const cwd = path.resolve(this._cwd, 'dist/lib')
    execaSync('node', ['install/check.cjs'], {
      cwd,
    })
  }

  private _loadSharp() {
    return require(SHARP_LIB_RESOLVE_PATH).default
  }
}
