import { execa } from 'execa'
import fs from 'fs-extra'
import os from 'node:os'
import path from 'node:path'
import { Emitter } from 'strict-event-emitter'
import * as vscode from 'vscode'
import { i18n } from '~/i18n'
import { Log } from '~/utils/Log'

type Events = {
  'install-success': [TSharp]
  'install-fail': []
}

type CacheType =
  /**
   * Os cache（os.tmpdir）
   */
  | 'os'
  /**
   * Extension cache (By default, sharp-related files are generated in the dist directory of the extension directory)
   */
  | 'extension'

export class Installer {
  private _cwd: string

  private readonly _osCacheDir = path.resolve(os.tmpdir(), 'vscode-image-manager-cache')

  event: Emitter<Events> = new Emitter()

  constructor(ctx: vscode.ExtensionContext) {
    this._cwd = ctx.extensionUri.fsPath
    Log.info(`Extension cwd: ${this._cwd}`)
  }

  async run() {
    try {
      let installedCache = this._getInstalledCache()

      if (!installedCache) {
        await this._showStausBar({
          beforeHide: this._install.bind(this),
        })
        // Try to save to system cache
        installedCache = await this._saveToTmpdirCache()
      } else {
        Log.debug('Sharp already installed, load from cache')
      }

      this.event.emit('install-success', this._loadSharp(installedCache))
    } catch (error) {
      Log.error(`Sharp binary file creation error: ${error}`)
      this.event.emit('install-fail')
    }
    return this
  }

  private async _showStausBar({ beforeHide }: { beforeHide: () => Promise<void> }) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
    const creating_text = i18n.t('prompt.initializing')
    statusBarItem.text = `$(sync~spin) ${creating_text}`
    statusBarItem.tooltip = i18n.t('prompt.initializing_tooltip')
    Log.info(creating_text)
    statusBarItem.show()

    await beforeHide()

    statusBarItem.hide()
    statusBarItem.dispose()
  }

  private _getCaches() {
    const RELEASE_DIR = 'build/Release'
    const SHARP_FS = 'sharp/index.js'

    const caches: { releaseFsPath: string; sharpFsPath: string; type: CacheType }[] = [
      {
        releaseFsPath: path.resolve(this._getSharpOsCacheDir(), RELEASE_DIR),
        sharpFsPath: path.resolve(this._getSharpOsCacheDir(), SHARP_FS),
        type: 'os',
      },
      {
        releaseFsPath: path.resolve(this._getSharpCwd(), RELEASE_DIR),
        sharpFsPath: path.resolve(this._getSharpCwd(), SHARP_FS),
        type: 'extension',
      },
    ]

    return caches
  }

  private _getInstalledCache(): CacheType | undefined {
    const cache = this._getCaches().find((cache) => {
      const { releaseFsPath, type } = cache
      if (!fs.existsSync(releaseFsPath)) {
        return false
      }
      Log.info(`Load from ${type} cache: ${releaseFsPath}`)
      return fs.readdirSync(releaseFsPath).some((item) => item.endsWith('.node'))
    })

    return cache?.type
  }

  private _loadSharp(cacheType: CacheType) {
    const localSharpPath = this._getCaches().find((cache) => cache.type === cacheType)?.sharpFsPath

    Log.debug(`Load sharp from: ${localSharpPath}`)

    return require(localSharpPath!).sharp
  }

  private async _saveToTmpdirCache() {
    const tempDir = os.tmpdir()

    return new Promise<CacheType>((resolve) => {
      fs.access(tempDir, fs.constants.W_OK, (err) => {
        if (err) {
          Log.debug(`Tmpdir not writable: ${tempDir}`)
          resolve('extension')
        } else {
          // Os Cache is writable

          // Ensure the existence of the cache directory
          fs.ensureDirSync(this._getSharpOsCacheDir())
          // Copy sharp files to cache directory
          fs.copySync(this._getSharpCwd(), this._getSharpOsCacheDir())
          Log.debug(`Copy sharp to tmpdir: ${this._getSharpOsCacheDir()}`)
          resolve('os')
        }
      })
    })
  }

  /**
   * Get sharp cwd
   * @returns /{extension-cwd}/dist/lib
   */
  private _getSharpCwd() {
    return path.resolve(this._cwd, 'dist/lib')
  }

  /**
   * Get the directory path of sharp in the system cache
   * @returns /{tmpdir}/vscode-image-manager-cache/lib
   */
  private _getSharpOsCacheDir() {
    return path.resolve(this._osCacheDir, 'lib')
  }

  private async _install() {
    const cwd = this._getSharpCwd()

    // If the language is Chinese, it is considered to be the Chinese region, then set npm mirror
    const isChina = i18n.language === 'zh-CN'

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
}
