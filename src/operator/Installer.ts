import { execaSync } from 'execa'
import fs from 'fs-extra'
import path from 'node:path'
import { Emitter } from 'strict-event-emitter'
import * as vscode from 'vscode'
import { Context } from '@/Context'
import { Log } from '@/utils/Log'

type Events = {
  'install-success': []
  'install-fail': []
}

export class Installer {
  private _cwd: string
  event: Emitter<Events>

  constructor() {
    this._cwd = Context.instance.ext.extensionUri.fsPath
    this.event = new Emitter<Events>()
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
      this.event.emit('install-success')
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
    execaSync('node', ['install/use-libvips.cjs'], {
      cwd,
    })
    execaSync('node', ['install/dll-copy.cjs'], {
      cwd,
    })
    execaSync('node', ['install/prebuild-install-bin.cjs'], {
      cwd,
    })
  }
}
