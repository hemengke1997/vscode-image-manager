import { destrUtil, isString, toLower } from '@minko-fe/lodash-pro'
// import delay from 'delay'
import EventEmitter from 'eventemitter3'
import { execaNode } from 'execa'
import fs from 'fs-extra'
import os from 'node:os'
import path from 'node:path'
import pTimout from 'p-timeout'
import { type ExtensionContext, StatusBarAlignment, type StatusBarItem, commands, window } from 'vscode'
import { i18n } from '~/i18n'
import { SHARP_LIBVIPS_VERSION } from '~/meta'
import { isValidHttpsUrl, normalizePath, setImmdiateInterval } from '~/utils'
import { Channel } from '~/utils/channel'
import { Config, Global } from '..'
import { version } from '../../../package.json'

export class TimeoutError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

export class AbortError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'AbortError'
  }
}

type Events = {
  'install-success': [TSharp]
  'install-fail': [TimeoutError | AbortError]
}

enum CacheType {
  /**
   * 系统级缓存 (os.homedir()|os.tmpDir()/.vscode-image-manager-cache)
   */
  os = 'os',
  /**
   * 扩展级缓存，默认情况下，sharp相关文件生成在扩展目录的dist目录下
   * Extension cache (By default, sharp-related files are generated in the dist directory of the extension directory)
   */
  extension = 'extension',
}

const CNPM_BINARY_REGISTRY = 'https://registry.npmmirror.com/-/binary'
const SHARP_LIBVIPS = 'sharp-libvips'
const VENDOR = 'vendor'

const INITIALIZING_TEXT = () => `🔄 ${i18n.t('prompt.initializing')}`

export class Installer {
  /**
   * 系统平台
   */
  public platform: string
  /**
   * 扩展根目录
   */
  private cwd: string
  /**
   * 状态栏
   */
  private _statusBarItem: StatusBarItem | undefined
  /**
   * libvips binary 文件名
   */
  private _libvips_bin: string
  /**
   * 是否使用镜像
   */
  private _useMirror = false
  /**
   * 是否已执行缓存操作
   */
  private _isCached = false
  /**
   * 缓存 package.json 文件路径
   */
  private _pkgCacheFilePath: string

  /**
   * vendor 里面是 libvips binary
   * 需要用户端下载
   * 为了避免用户每次安装扩展后都下载此依赖，需要把依赖缓存到本地中
   *
   * build 里面是 sharp binary
   * 由于 sharp@0.33.0 之后无法再本地编译，所以我fork了sharp，更新其核心功能。所以无法从npm镜像上下载了
   * 为了更好的用户体验，把常见系统的二进制文件打包到了扩展内
   * 从 v1.0.0 开始，内置在扩展源码中了
   *
   * json 里面是 sharp 的 package.json
   *
   * sharp 里面是 sharp 的 index.js 源码
   */
  private readonly _cacheable = [VENDOR, 'build', 'json', 'sharp']

  public readonly cacheDir: string

  event: EventEmitter<Events> = new EventEmitter()

  constructor(
    public ctx: ExtensionContext,
    public options: {
      timeout: number
    },
  ) {
    // 如果语言是中文，视为中国地区，设置npm镜像
    const languages = [Config.appearance_language, Global.vscodeLanguage].map(toLower)
    this._useMirror = languages.includes('zh-cn') || Config.mirror_enabled

    this.cwd = ctx.extensionUri.fsPath
    this.platform = require(path.resolve(this.getSharpCwd(), 'install/platform')).platform()

    const osCacheDirWritable = [os.homedir(), os.tmpdir()].find((dir) => this._isDirectoryWritable(dir))
    if (osCacheDirWritable) {
      // 可以写到系统临时盘中
      this.cacheDir = path.resolve(osCacheDirWritable, '.vscode-image-manager-cache')
    } else {
      // 否则写到扩展根目录下的 dist 目录中
      this.cacheDir = path.join(this.cwd, 'dist')
    }

    this._pkgCacheFilePath = path.join(this.getDepOsCacheDir(), 'package.json')
    this._libvips_bin = `libvips-${SHARP_LIBVIPS_VERSION}-${this.platform}.tar.gz`

    Channel.divider()
    Channel.info(`${i18n.t('core.dep_cache_dir')}: ${this.cacheDir}`)
    Channel.info(`${i18n.t('core.extension_root')}: ${this.cwd}`)
    Channel.info(`${i18n.t('core.tip')}: ${i18n.t('core.dep_url_tip')} ⬇️`)
    Channel.info(
      `${i18n.t('core.dep_url')}: ${CNPM_BINARY_REGISTRY}/${SHARP_LIBVIPS}/v${SHARP_LIBVIPS_VERSION}/${this._libvips_bin}`,
    )
    Channel.divider()
  }

  async run() {
    try {
      const cacheTypes = this._getInstalledCacheTypes()

      Channel.debug(`Installed cache types: ${cacheTypes}`)

      // 如果系统/扩展均无满足版本条件的缓存，则安装依赖
      if (!cacheTypes?.length || Config.debug_forceInstall) {
        // 显示左下角状态栏
        this._showStausBar()
        const abortController = new AbortController()
        const Cancel = i18n.t('prompt.cancel')
        window.showInformationMessage(INITIALIZING_TEXT(), Cancel).then((r) => {
          if (r === Cancel) {
            abortController.abort()
          }
        })
        try {
          await pTimout(
            // delay(this.options.timeout),
            this._install(),
            {
              milliseconds: this.options.timeout,
              signal: abortController.signal,
            },
          )
        } catch (e) {
          const message = e instanceof Error ? e.message : ''
          if (message.includes('timed out')) {
            throw new TimeoutError()
          } else if (message.includes('aborted')) {
            throw new AbortError()
          }
          throw e
        } finally {
          // 隐藏左下角状态栏
          this._hideStatusBar()
        }

        Channel.info(`✅ ${i18n.t('prompt.initialized')}`, true)
        await this._trySaveCacheToOs(this._cacheable)
      } else {
        Channel.info(`${i18n.t('core.load_from_cache')}: ${cacheTypes[0]}`)

        // 如果os中没有缓存，则设置os缓存
        if (!cacheTypes.includes(CacheType.os)) {
          await this._trySaveCacheToOs(this._cacheable)
        }
      }

      fs.ensureFileSync(this._pkgCacheFilePath)
      const pkg = this._readPkgJson()

      Channel.debug(`Cached package.json: ${JSON.stringify(pkg)}`)

      if (pkg.libvips !== SHARP_LIBVIPS_VERSION) {
        fs.emptyDirSync(path.resolve(this.getDepOsCacheDir(), VENDOR))
        Channel.info(i18n.t('core.libvips_diff'))
        await this._trySaveCacheToOs([VENDOR], { force: true })
        this._writePkgJson({ libvips: SHARP_LIBVIPS_VERSION })
      }

      if (pkg.version !== version) {
        Channel.info(i18n.t('core.version_diff'))
        await this._trySaveCacheToOs(this._cacheable)
        this._writePkgJson({ version })
      }

      const currentCacheType = this._getInstalledCacheTypes()![0]
      Channel.debug(`Current cache type: ${currentCacheType}`)
      this.event.emit('install-success', await this._pollingLoadSharp(currentCacheType))
    } catch (e) {
      this.event.emit('install-fail', e as Error)
    }
    return this
  }

  private _readPkgJson() {
    const pkgStr = fs.readFileSync(this._pkgCacheFilePath, 'utf-8')
    let pkg: { version?: string; libvips?: string } = {}
    if (isString(pkgStr)) {
      try {
        pkg = destrUtil.destr<AnyObject>(pkgStr)
      } catch {}
    }
    return pkg
  }

  private _writePkgJson(value: Record<string, string>) {
    fs.writeJSONSync(this._pkgCacheFilePath, {
      ...this._readPkgJson(),
      ...value,
    })
  }

  private _isDirectoryWritable(dirPath: string) {
    try {
      fs.accessSync(dirPath, fs.constants.W_OK)
      return true
    } catch (err) {
      return false
    }
  }

  /**
   * 显示状态栏
   */
  private _showStausBar() {
    this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left)
    Global.context.subscriptions.push(this._statusBarItem)
    this._statusBarItem.text = `$(sync~spin) ${INITIALIZING_TEXT()}`
    this._statusBarItem.tooltip = i18n.t('prompt.initializing_tooltip')
    this._statusBarItem.show()
  }

  /**
   * 隐藏状态栏
   */
  private _hideStatusBar() {
    this._statusBarItem?.hide()
    this._statusBarItem?.dispose()
  }

  /**
   * 预定义的缓存依赖数组
   */
  public getCaches() {
    const RELEASE_DIR = 'build/Release'
    const VENDOR_DIR = `${VENDOR}/${SHARP_LIBVIPS_VERSION}`
    const SHARP_FS = 'sharp/index.js'

    const cachedFiles = [
      {
        key: 'releaseDirPath',
        value: RELEASE_DIR,
      },
      {
        key: 'vendorDirPath',
        value: VENDOR_DIR,
      },
      {
        key: 'sharpFsPath',
        value: SHARP_FS,
      },
    ]

    const caches = [
      {
        type: CacheType.os,
        cwd: this.getDepOsCacheDir(),
      },
      {
        type: CacheType.extension,
        cwd: this.getSharpCwd(),
      },
    ].map(({ type, cwd }) => {
      return cachedFiles.reduce((prev, current) => {
        return {
          ...prev,
          [current.key]: normalizePath(path.resolve(cwd, current.value)),
          type,
        }
      }, {})
    }) as { releaseDirPath: string; vendorDirPath: string; sharpFsPath: string; type: CacheType }[]

    return caches
  }

  /**
   * 获取已安装的缓存类型
   */
  private _getInstalledCacheTypes(): CacheType[] | undefined {
    const caches = this.getCaches()
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
    const localSharpPath = this.getCaches().find((cache) => cache.type === cacheType)!.sharpFsPath

    Channel.debug(`Load sharp from: ${localSharpPath}`)

    return new Promise<TSharp>((resolve, reject) => {
      try {
        const sharpModule = require(localSharpPath)
        Channel.info(i18n.t('core.load_core_script_success'))
        resolve(sharpModule.default || sharpModule.sharp)
      } catch (e) {
        Channel.error(`${i18n.t('core.load_core_script_fail')}: ${e}`)
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

          const restart = i18n.t('prompt.reload_now')

          window.showErrorMessage(i18n.t('prompt.load_sharp_failed'), restart).then((res) => {
            if (res === restart) {
              commands.executeCommand('workbench.action.reloadWindow')
            }
          })
          return
        }
        time++
        Channel.debug(`Try polling load sharp: ${time} time, cacheType: ${cacheType}`)
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

  private async _trySaveCacheToOs(
    cacheDirs: string[],
    options: {
      force?: boolean
    } = {},
  ) {
    return new Promise<boolean>((resolve) => {
      fs.access(this.cacheDir, fs.constants.W_OK, async (err) => {
        if (err) {
          Channel.info(`${this.cacheDir} not writable`)
          resolve(false)
        } else {
          // Os Cache is writable
          const { force } = options
          if (!this._isCached || force) {
            // Ensure the existence of the cache directory
            fs.ensureDirSync(this.getDepOsCacheDir())

            // Copy stable files to cache directory
            await this._copyDirsToOsCache(cacheDirs)
            if (!force) this._isCached = true
          }
          resolve(true)
        }
      })
    })
  }

  private _copyDirsToOsCache(dirs: string[]) {
    Channel.debug(`Copy [${dirs.join(',')}] to ${this.getDepOsCacheDir()}`)

    return Promise.all(
      dirs.map(async (dir) => {
        const source = path.resolve(this.getSharpCwd(), dir)
        if (fs.existsSync(source)) {
          await fs.copy(path.resolve(this.getSharpCwd(), dir), path.resolve(this.getDepOsCacheDir(), dir))
          Channel.debug(`Copy ${dir} success`)
        } else {
          Channel.debug(`${dir} not exists`)
        }
      }),
    )
  }

  /**
   * 获取sharp的cwd
   * @returns /{extension-cwd}/dist/lib
   */
  private getSharpCwd() {
    return path.resolve(this.cwd, 'dist/lib')
  }

  /**
   * 获取系统缓存中依赖的目录路径
   * @returns /{tmpdir}/vscode-image-manager-cache/lib
   */
  public getDepOsCacheDir() {
    return path.resolve(this.cacheDir, 'lib')
  }

  private async _rmDir(dir: string) {
    if (fs.existsSync(dir)) {
      await fs.rmdir(dir, { recursive: true })
    }
  }

  public async clearCaches() {
    // 清除 os cache
    await this._rmDir(this.getDepOsCacheDir())

    // 清除 extension cache
    ;[VENDOR].forEach(async (dir) => {
      await this._rmDir(path.resolve(this.getSharpCwd(), dir))
    })
  }

  private async _install() {
    const cwd = this.getSharpCwd()

    Channel.debug(`useMirror: ${this._useMirror}`)

    const resolveMirrorUrl = ({ name, fallbackUrl }: { name: string; fallbackUrl: string }) => {
      if (this._useMirror) {
        if (isValidHttpsUrl(Config.mirror_url)) {
          return new URL(`${Config.mirror_url}/${name}`).toString()
        }
        return fallbackUrl
      }
      return ''
    }

    const extensionHost = this.ctx.extensionUri.fsPath
    const sharpBinaryReleaseDir = path.resolve(extensionHost, 'releases')

    Channel.debug(`extensionHost: ${extensionHost}`)
    Channel.debug(`sharpBinaryReleaseDir: ${sharpBinaryReleaseDir}`)

    // 如果扩展根目录有 libvips 的 .tar.gz 文件，用户可能有意手动安装依赖
    const libvipsBins = fs.readdirSync(extensionHost).filter((file) => /^libvips.+\.tar\.gz$/.test(file))

    const sharpBins = fs.readdirSync(sharpBinaryReleaseDir).filter((file) => /^sharp.+\.tar\.gz$/.test(file))

    const manualInstallSuccess = {
      libvips: false,
    }

    if (libvipsBins.length) {
      Channel.info(`libvips ${i18n.t('core.start_manual_install')}: ${libvipsBins.join(', ')}`)
      for (let i = 0; i < libvipsBins.length; i++) {
        // 尝试手动安装
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
        const npm_config_sharp_libvips_binary_host = resolveMirrorUrl({
          name: SHARP_LIBVIPS,
          fallbackUrl: `${CNPM_BINARY_REGISTRY}/${SHARP_LIBVIPS}`,
        })

        Channel.debug(`libvips binary host: ${npm_config_sharp_libvips_binary_host}`)

        await execaNode('install/install-libvips.js', {
          cwd,
          env: {
            ...process.env,
            npm_package_config_libvips: SHARP_LIBVIPS_VERSION,
            npm_config_sharp_libvips_binary_host,
          },
          stdout: 'pipe',
        })
      } catch (e) {
        Channel.error(e)
        // 安装失败
        if (manualInstallSuccess.libvips === false) {
          Channel.error(`${i18n.t('core.manual_install_failed')}: ${this._libvips_bin}`)
          Channel.error(i18n.t('core.manual_install_failed'), true)
        } else {
          Channel.error(i18n.t('core.dep_install_fail'), true)
        }
      }
    }

    await execaNode('install/dll-copy.js', {
      cwd,
    })

    if (sharpBins.length) {
      Channel.info(`sharp binary ${i18n.t('core.start_auto_install')}: ${sharpBins.join(', ')}`)

      let installSuccess = false

      for (let i = 0; i < sharpBins.length; i++) {
        try {
          await execaNode(
            'install/unpack-sharp.js',
            [`--path=${cwd}`, `--binPath=${path.join(sharpBinaryReleaseDir, sharpBins[i])}`],
            {
              cwd,
            },
          )
          Channel.info(`${i18n.t('core.auto_install_success')}: ${sharpBins[i]}`)
          installSuccess = true
          break
        } catch {
          installSuccess = false
        }
      }
      if (!installSuccess) {
        Channel.error(`sharp ${i18n.t('core.dep_install_fail')}`, true)
      }
    } else {
      Channel.error(`sharp ${i18n.t('core.dep_install_fail')}`, true)
    }

    Channel.info(i18n.t('core.install_finished'))
  }
}
