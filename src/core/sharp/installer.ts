import { destrUtil, isString, toLower } from '@minko-fe/lodash-pro'
import EventEmitter from 'eventemitter3'
import { execaNode } from 'execa'
import fs from 'fs-extra'
import os from 'node:os'
import path from 'node:path'
import { type ExtensionContext, StatusBarAlignment, type StatusBarItem, commands, window } from 'vscode'
import { i18n } from '~/i18n'
import { SHARP_LIBVIPS_VERSION } from '~/meta'
import { isValidHttpsUrl, setImmdiateInterval } from '~/utils'
import { Channel } from '~/utils/channel'
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

const CNPM_BINARY_REGISTRY = 'https://registry.npmmirror.com/-/binary'

export class Installer {
  public platform: string
  private _cwd: string
  private _statusBarItem: StatusBarItem | undefined
  private _libvips_bin: string
  private _useMirror = false

  /**
   * vendor 里面是 sharp libvips 依赖
   * 需要用户端下载
   * 为了避免用户每次安装扩展后都下载此依赖，需要把依赖缓存到本地中
   */
  private readonly _stables = ['vendor']

  /**
   * build 里面是 sharp binary
   * 由于 sharp@0.33.0 之后无法再本地编译，所以我fork了sharp，更新其核心功能。所以无法从npm镜像上下载了
   * 为了更好的用户体验，把常见系统的二进制文件打包到了扩展内
   * 从 v1.0.0 开始，内置在扩展源码中了
   */
  private readonly _unstables = ['build', 'json', 'sharp']

  private readonly _osCacheDir: string

  event: EventEmitter<Events> = new EventEmitter()

  constructor(public ctx: ExtensionContext) {
    // If the language is Chinese, it's considered as Chinese region, then set npm mirror
    const languages = [Config.appearance_language, Global.vscodeLanguage].map(toLower)
    this._useMirror = languages.includes('zh-cn') || Config.mirror_enabled

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

    this._libvips_bin = `libvips-${SHARP_LIBVIPS_VERSION}-${this.platform}.tar.gz`

    Channel.info(`${i18n.t('core.tip')}: ${i18n.t('core.dep_url')} ⬇️`)
    Channel.info(`${CNPM_BINARY_REGISTRY}/sharp-libvips/v${SHARP_LIBVIPS_VERSION}/${this._libvips_bin}`)
  }

  async run() {
    try {
      const cacheTypes = this._getInstalledCacheTypes()
      let currentCacheType: CacheType

      // If there is no cache, install
      if (!cacheTypes?.length || Config.debug_forceInstall) {
        await this._showStausBar({
          beforeHide: this._install.bind(this),
        })
        await this._trySaveCacheToOs(this._stables)
      } else {
        currentCacheType = cacheTypes[0]

        Channel.info(`Dependency already installed, load from cache: ${currentCacheType}`)

        switch (currentCacheType) {
          case 'extension': {
            // It's extension cache
            await this._trySaveCacheToOs(this._stables)
            break
          }
          case 'os': {
            // Sharp exists in the os cache, but not in the extension cache
            if (!cacheTypes.includes('extension')) {
              Channel.info('Dependency exists in the os cache, not in the extension cache')
              // Is it necessary to reinstall?
              // this._install()
            }
            break
          }
        }
      }

      const pkgCacheFilePath = path.join(this._getDepOsCacheDir(), 'package.json')
      fs.ensureFileSync(pkgCacheFilePath)

      const pkgStr = fs.readFileSync(pkgCacheFilePath, 'utf-8')
      let pkg: { version?: string; libvips?: string } = {}
      if (isString(pkgStr)) {
        try {
          pkg = destrUtil.destr<AnyObject>(pkgStr)
        } catch {}
      }

      Channel.debug(`Cache package.json: ${JSON.stringify(pkg)}`)

      if (pkg.libvips !== SHARP_LIBVIPS_VERSION) {
        fs.emptyDirSync(path.resolve(this._getDepOsCacheDir(), 'vendor'))
        Channel.info(`libvips version is different, copy stables files to os cache`)
        await this._trySaveCacheToOs(this._stables)
      }

      if (pkg.version !== version) {
        Channel.info('Cache extension version is different, copy unstable files to os cache')
        await this._trySaveCacheToOs(this._unstables)
      }

      fs.writeJSONSync(pkgCacheFilePath, {
        version,
        libvips: SHARP_LIBVIPS_VERSION,
      })

      this.event.emit('install-success', await this._pollingLoadSharp(this._getInstalledCacheTypes()![0]))
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
      this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left)
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
    const VENDOR_DIR = `vendor/${SHARP_LIBVIPS_VERSION}`
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
          // vendor exists
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

  private async _loadSharp(cacheType: CacheType) {
    const localSharpPath = this._getCaches().find((cache) => cache.type === cacheType)!.sharpFsPath

    Channel.debug(`Load sharp from: ${localSharpPath}`)

    return new Promise<TSharp>((resolve, reject) => {
      try {
        const sharpModule = require(localSharpPath)
        Channel.info('Load dependencies successfully')
        resolve(sharpModule.default || sharpModule.sharp)
      } catch (e) {
        Channel.debug(`Load sharp failed: ${e}`)
        reject(e)
      }
    })
  }

  private async _pollingLoadSharp(cacheType: CacheType) {
    const maxTimes = 5
    let time = 0
    return new Promise<TSharp>((resolve) => {
      const interval = setImmdiateInterval(async () => {
        if (time >= maxTimes) {
          clearInterval(interval)
          // clear deps cache
          fs.removeSync(this._getDepOsCacheDir())

          const restart = i18n.t('prompt.reload_now')

          window.showErrorMessage(i18n.t('prompt.load_sharp_failed'), restart).then((res) => {
            if (res === restart) {
              commands.executeCommand('workbench.action.reloadWindow')
            }
          })
          return
        }
        time++
        Channel.debug(`Try polling load sharp: ${time}`)
        try {
          const res = await this._loadSharp(cacheType)
          if (res) {
            resolve(res)
            clearInterval(interval)
          }
        } catch {}
      }, 250)
    })
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
          this._copyDirsToOsCache(cacheDirs)

          Channel.debug(`Copy [${cacheDirs.join(',')}] to ${this._getDepOsCacheDir()}`)
          resolve(true)
        }
      })
    })
  }

  private _copyDirsToOsCache(dirs: string[]) {
    dirs.forEach((dir) =>
      fs.copySync(path.resolve(this._getSharpCwd(), dir), path.resolve(this._getDepOsCacheDir(), dir)),
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

    Channel.debug(`useMirror: ${this._useMirror}`)

    const resolveMirrorUrl = (name: string, fallbackUrl: string) => {
      if (this._useMirror) {
        if (isValidHttpsUrl(Config.mirror_url)) {
          return new URL(`${Config.mirror_url}/${name}`).toString()
        }
        return fallbackUrl
      }
      return ''
    }

    // If there is a .tar.br file in the extension root directory,
    // the user may intend to install the dependency manually
    const extensionHost = this.ctx.extensionUri.fsPath
    const sharpBinaryReleaseDir = path.resolve(extensionHost, 'releases')

    Channel.debug(`extensionHost: ${extensionHost}`)
    Channel.debug(`sharpBinaryReleaseDir: ${sharpBinaryReleaseDir}`)

    const libvipsBins = fs.readdirSync(extensionHost).filter((file) => /^libvips.+\.tar\.gz$/.test(file))
    const sharpBins = fs.readdirSync(sharpBinaryReleaseDir).filter((file) => /^sharp.+\.tar\.gz$/.test(file))

    const manualInstallSuccess = {
      libvips: false,
    }

    if (libvipsBins.length) {
      Channel.info(`libvips ${i18n.t('core.start_manual_install')}: ${libvipsBins.join(', ')}`)
      for (let i = 0; i < libvipsBins.length; i++) {
        // Try install manually
        try {
          await execaNode('install/unpack-libvips.js', [path.join(extensionHost, libvipsBins[i])], {
            cwd,
            env: {
              ...process.env,
            },
          })
          manualInstallSuccess.libvips = true
          Channel.info(`${i18n.t('core.manual_install_success')}: ${libvipsBins[i]}`)
          break
        } catch (e) {
          manualInstallSuccess.libvips = false
        }
      }
    }

    if (!manualInstallSuccess.libvips) {
      Channel.info(`libvips ${i18n.t('core.start_auto_install')}`)

      try {
        const npm_config_sharp_libvips_binary_host = resolveMirrorUrl(
          'sharp-libvips',
          `${CNPM_BINARY_REGISTRY}/sharp-libvips`,
        )

        Channel.debug(`npm_config_sharp_libvips_binary_host: ${npm_config_sharp_libvips_binary_host}`)

        await execaNode('install/install-libvips.js', {
          cwd,
          env: {
            ...process.env,
            npm_package_config_libvips: SHARP_LIBVIPS_VERSION,
            npm_config_sharp_libvips_binary_host,
          },
        })
      } catch (e) {
        Channel.error(e)
        // Install failed.
        if (manualInstallSuccess.libvips === false) {
          Channel.error(`${i18n.t('core.manual_install_failed')}: ${this._libvips_bin}`)
          Channel.error(i18n.t('core.manual_install_failed'), true)
        } else {
          Channel.error(i18n.t('core.dep_not_found'), true)
        }
      }
    }

    await execaNode('install/dll-copy.js', {
      cwd,
    })

    if (sharpBins.length) {
      Channel.info(`sharp binary ${i18n.t('core.start_manual_install')}: ${sharpBins.join(', ')}`)

      for (let i = 0; i < sharpBins.length; i++) {
        try {
          await execaNode(
            'install/unpack-sharp.js',
            [`--path=${this._getSharpCwd()}`, `--binPath=${path.join(sharpBinaryReleaseDir, sharpBins[i])}`],
            {
              cwd,
            },
          )
          Channel.info(`${i18n.t('core.manual_install_success')}: ${sharpBins[i]}`)
          break
        } catch (e) {}
      }
    } else {
      Channel.error(i18n.t('core.dep_not_found'), true)
    }

    Channel.info('🚐 Dependencies install process finished')
  }
}
