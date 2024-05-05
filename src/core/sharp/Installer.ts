import { toLower } from '@minko-fe/lodash-pro'
import EventEmitter from 'eventemitter3'
import { execa } from 'execa'
import fs from 'fs-extra'
import os from 'node:os'
import path from 'node:path'
import * as vscode from 'vscode'
import { i18n } from '~/i18n'
import { isValidHttpsUrl } from '~/utils'
import { Channel } from '~/utils/Channel'
import { Config, Global } from '..'
import { version } from '../../../package.json'

type Events = {
  'install-success': [TSharp]
  'install-fail': []
}

type CacheType =
  /**
   * Os cache (os.homedir()|os.tmpDir()/.vscode-image-manager-cache)
   */
  | 'os'
  /**
   * Extension cache (By default, sharp-related files are generated in the dist directory of the extension directory)
   */
  | 'extension'

export class Installer {
  public platform: string
  private _cwd: string
  private _statusBarItem: vscode.StatusBarItem | undefined
  private readonly _stables = ['build', 'vendor', 'sharp']
  private readonly _unstables = ['install', 'json']
  private readonly _osCacheDir: string

  event: EventEmitter<Events> = new EventEmitter()

  constructor(public ctx: vscode.ExtensionContext) {
    this._cwd = ctx.extensionUri.fsPath
    this.platform = require(path.resolve(this._getSharpCwd(), 'install/platform')).platform()
    const cacheDir = [os.homedir(), os.tmpdir()].find((dir) => this._isDirectoryWritable(dir))
    if (cacheDir) {
      this._osCacheDir = path.resolve(cacheDir, '.vscode-image-manager-cache')
    } else {
      this._osCacheDir = path.join(this._cwd, 'dist')
    }

    Channel.info(`${i18n.t('core.dep_cache_dir')}: ${this._osCacheDir}`)
    Channel.info(`${i18n.t('core.extension_root')}: ${this._cwd}`)
    Channel.info(`${i18n.t('core.platform')}: ${this.platform}`)
  }

  async run() {
    try {
      const cacheTypes = this._getInstalledCacheTypes()
      let currentCacheType: CacheType

      // If there is no cache, install
      if (!cacheTypes?.length) {
        await this._showStausBar({
          beforeHide: this._install.bind(this),
        })
        this._trySaveCacheToOs(this._stables)
      } else {
        currentCacheType = cacheTypes[0]

        Channel.info(`Dependency already installed, load from cache: ${currentCacheType}`)

        switch (currentCacheType) {
          case 'extension': {
            // It's extension cache
            this._trySaveCacheToOs(this._stables)
            break
          }
          case 'os': {
            // Sharp exists in the os cache, but not in the extension cache
            if (!cacheTypes.includes('extension')) {
              Channel.info('Dependency exists in the os cache, but not in the extension cache')
              // Is it necessary to reinstall?
              // this._install()
            }
            break
          }
        }
      }

      const pkgCacheFilePath = path.join(this._getDepOsCacheDir(), 'package.json')
      fs.ensureFileSync(pkgCacheFilePath)
      let pkg: any = fs.readFileSync(pkgCacheFilePath, 'utf-8')
      if (pkg) {
        pkg = JSON.parse(pkg)
      } else {
        pkg = {}
      }
      Channel.debug(`Cache package.json: ${JSON.stringify(pkg)}`)
      if (pkg.version !== version) {
        Channel.info('Cache extension version is different, copy unstable files to os cache')
        await this._trySaveCacheToOs(this._unstables)
        fs.writeJSONSync(pkgCacheFilePath, { version })
      }
      this.event.emit('install-success', this._loadSharp(this._getInstalledCacheTypes()![0]))
    } catch (error) {
      Channel.error(error)
      this.event.emit('install-fail')
    }
    return this
  }

  private _isDirectoryWritable(dirPath: string) {
    try {
      fs.accessSync(dirPath, fs.constants.W_OK)
      return true
    } catch (err) {
      return false
    }
  }

  private async _showStausBar({ beforeHide }: { beforeHide: () => Promise<void> }) {
    try {
      this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
      Global.context.subscriptions.push(this._statusBarItem)
      const creating_text = `🔄 ${i18n.t('prompt.initializing')}`
      this._statusBarItem.text = `$(sync~spin) ${creating_text}`
      this._statusBarItem.tooltip = i18n.t('prompt.initializing_tooltip')
      Channel.info(creating_text, true)
      this._statusBarItem.show()
      await beforeHide()
      Channel.info(`✅ ${i18n.t('prompt.initialized')}`, true)
    } finally {
      this._statusBarItem?.hide()
      this._statusBarItem?.dispose()
    }
  }

  private _getCaches() {
    const RELEASE_DIR = 'build/Release'
    const VENDOR_DIR = 'vendor/8.14.5'
    const SHARP_FS = 'sharp/index.js'

    const caches: { releaseDirPath: string; vendorDirPath: string; sharpFsPath: string; type: CacheType }[] = [
      {
        releaseDirPath: path.resolve(this._getDepOsCacheDir(), RELEASE_DIR),
        vendorDirPath: path.resolve(this._getDepOsCacheDir(), VENDOR_DIR),
        sharpFsPath: path.resolve(this._getDepOsCacheDir(), SHARP_FS),
        type: 'os',
      },
      {
        releaseDirPath: path.resolve(this._getSharpCwd(), RELEASE_DIR),
        sharpFsPath: path.resolve(this._getSharpCwd(), SHARP_FS),
        vendorDirPath: path.resolve(this._getSharpCwd(), VENDOR_DIR),
        type: 'extension',
      },
    ]

    return caches
  }

  // Get all installed cache type
  private _getInstalledCacheTypes(): CacheType[] | undefined {
    const caches = this._getCaches()
      .filter((cache) => {
        const { releaseDirPath, sharpFsPath, vendorDirPath } = cache
        if (
          // .node file exists
          fs.existsSync(releaseDirPath) &&
          fs.readdirSync(releaseDirPath).some((t) => t.includes('.node')) &&
          // vendor/8.14.5 exists
          fs.existsSync(vendorDirPath) &&
          // sharp/index.js exists
          fs.existsSync(sharpFsPath)
        ) {
          return true
        }
        return false
      })
      .map((cache) => cache.type)

    return caches
  }

  private _loadSharp(cacheType: CacheType) {
    const localSharpPath = this._getCaches().find((cache) => cache.type === cacheType)?.sharpFsPath

    Channel.debug(`Load sharp from: ${localSharpPath}`)

    return require(localSharpPath!).sharp
  }

  private async _trySaveCacheToOs(cacheDirs: string[]) {
    return new Promise<boolean>((resolve) => {
      fs.access(this._osCacheDir, fs.constants.W_OK, async (err) => {
        if (err) {
          Channel.info(`${this._osCacheDir} not writable`)
          resolve(false)
        } else {
          // Os Cache is writable

          // Ensure the existence of the cache directory
          fs.ensureDirSync(this._getDepOsCacheDir())

          // Copy stable files to cache directory
          await this._copyDirsToOsCache(cacheDirs)

          Channel.debug(`Copy [${cacheDirs.join(',')}] to ${this._osCacheDir}: ${this._getDepOsCacheDir()}`)
          resolve(true)
        }
      })
    })
  }

  private _copyDirsToOsCache(dirs: string[]) {
    return Promise.all(
      dirs.map((dir) => fs.copy(path.resolve(this._getSharpCwd(), dir), path.resolve(this._getDepOsCacheDir(), dir))),
    )
  }

  /**
   * Get sharp cwd
   * @returns /{extension-cwd}/dist/lib
   */
  private _getSharpCwd() {
    return path.resolve(this._cwd, 'dist/lib')
  }

  /**
   * Get the directory path of deps in the system cache
   * @returns /{tmpdir}/vscode-image-manager-cache/lib
   */
  private _getDepOsCacheDir() {
    return path.resolve(this._osCacheDir, 'lib')
  }

  private async _install() {
    const cwd = this._getSharpCwd()

    // If there is a .tar.br file in the extension root directory,
    // the user may intend to install the dependency manually
    const extensionHost = this.ctx.extensionUri.fsPath
    const tarbr = fs.readdirSync(extensionHost).filter((file) => /^libvips.+\.tar\.br$/.test(file))
    let manualInstallSuccess: boolean | undefined

    if (tarbr.length) {
      Channel.info(`${i18n.t('core.start_manual_install')}: ${tarbr.join(', ')}`)
      for (let i = 0; i < tarbr.length; i++) {
        // Try install manually
        try {
          await execa('node', ['install/extract-tarball.js', path.join(extensionHost, tarbr[i])], {
            cwd,
          })
          manualInstallSuccess = true
          Channel.info(`${i18n.t('core.manual_install_success')}: ${tarbr[i]}`)
          break
        } catch (e) {
          manualInstallSuccess = false
        }
      }
    }

    // If the language is Chinese, it's considered as Chinese region, then set npm mirror
    const languages = [Config.appearance_language, Global.vscodeLanguage].map(toLower)
    const useMirror = languages.includes('zh-cn') || Config.mirror_enabled

    if (!manualInstallSuccess) {
      Channel.info(i18n.t('core.start_auto_install'))
      try {
        await execa('node', ['install/use-libvips.js'], {
          cwd,
          env: {
            ...process.env,
            npm_package_config_libvips: '8.14.5',
            ...(useMirror && {
              npm_config_sharp_libvips_binary_host: isValidHttpsUrl(Config.mirror_url)
                ? Config.mirror_url.replace(/\/$/, '')
                : 'https://registry.npmmirror.com/-/binary/sharp-libvips',
              // Fullpath
              // ${npm_config_sharp_libvips_binary_host}/v8.14.5/libvips-8.14.5-${this.platform}.tar.br
            }),
          },
        })
      } catch (e) {
        Channel.error(e)
        // Install failed.
        if (manualInstallSuccess === false) {
          Channel.error(`${i18n.t('core.manual_install_failed')}: libvips-8.14.5-${this.platform}.tar.br`)
          Channel.error(i18n.t('core.manual_install_failed'), true)
        } else {
          Channel.error(i18n.t('core.dep_not_found'), true)
        }
      }
    }

    await execa('node', ['install/dll-copy.js'], {
      cwd,
    })
    await execa('node', ['install/prebuild-install-bin.js'], {
      cwd,
    })

    Channel.info('🚐 Dependencies install process finished')
  }
}
