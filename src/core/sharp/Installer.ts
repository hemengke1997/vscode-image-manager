import { execa } from 'execa'
import fs from 'fs-extra'
import path from 'node:path'
import { Emitter } from 'strict-event-emitter'
import * as vscode from 'vscode'
import { i18n } from '~/i18n'
import { Log } from '~/utils/Log'

type Events = {
  'install-success': [TSharp]
  'install-fail': []
}

const SHARP_LIB_RESOLVE_PATH = './lib/sharp/index.js'

export class Installer {
  private _cwd: string
  event: Emitter<Events> = new Emitter()

  constructor(ctx: vscode.ExtensionContext) {
    this._cwd = ctx.extensionUri.fsPath
    Log.info(`Extension cwd: ${this._cwd}`)
  }

  async run() {
    try {
      if (!this._isInstalled()) {
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
        statusBarItem.text = 'Image Manager Initializing...'
        Log.info('Sharp creating...')
        statusBarItem.show()
        await this._install()
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

  private async _install() {
    const cwd = path.resolve(this._cwd, 'dist/lib')

    // 如果是语言是中文，则认为是中国区域，设置npm镜像
    const isChina = i18n.language === 'zh-cn'

    await execa('node', ['install/use-libvips.js'], {
      cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        npm_config_sharp_libvips_binary_host: isChina ? 'https://npmmirror.com/mirrors/sharp-libvips' : '',
        npm_config_sharp_binary_host: isChina ? 'https://npmmirror.com/mirrors/sharp' : '',
      },
    })
    await execa('node', ['install/dll-copy.js'], {
      cwd,
      stdio: 'inherit',
    })
    await execa('node', ['install/prebuild-install-bin.js'], {
      cwd,
      stdio: 'inherit',
    })
  }

  private _loadSharp() {
    return require(SHARP_LIB_RESOLVE_PATH).sharp
  }
}
