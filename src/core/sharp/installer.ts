import { destrUtil, isString, toLower } from '@minko-fe/lodash-pro'
import { devDependencies, version } from '~root/package.json'
import EventEmitter from 'eventemitter3'
import { execaNode } from 'execa'
import fs from 'fs-extra'
import path from 'node:path'
import { StatusBarAlignment, type StatusBarItem, commands, window } from 'vscode'
import { mirrors } from '~/commands/mirror'
import { i18n } from '~/i18n'
import { SHARP_LIBVIPS_VERSION } from '~/meta'
import { cleanVersion, isValidHttpsUrl, normalizePath, setImmdiateInterval } from '~/utils'
import { type AbortError, type TimeoutError, abortPromise } from '~/utils/abort-promise'
import { Channel } from '~/utils/channel'
import { Config, FileCache, Global } from '..'

type Events = {
  'install-success': [TSharp]
  'install-fail': [TimeoutError | AbortError | Error]
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

const CNPM_BINARY_REGISTRY = mirrors[0].description
const SHARP_LIBVIPS = 'sharp-libvips'
const VENDOR = 'vendor'
const BUILD = 'build'
const CACHE_JSON = 'cache.json'

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
   * 缓存 cache.json 文件路径
   */
  private _cacheFilePath: string

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
  private readonly _cacheable = [VENDOR, BUILD, 'json', 'sharp']

  event: EventEmitter<Events> = new EventEmitter()

  constructor(
    public options: {
      timeout: number
    },
  ) {
    // 如果语言是中文，视为中国地区，设置npm镜像
    const languages = [Config.appearance_language, Global.vscodeLanguage].map(toLower)
    this._useMirror = languages.includes('zh-cn') || Config.mirror_enabled

    this.cwd = Global.context.extensionUri.fsPath
    this.platform = require(path.resolve(this.getSharpCwd(), 'install/platform')).platform()

    this._cacheFilePath = path.join(this.getDepCacheDir(), CACHE_JSON)

    this._libvips_bin = `libvips-${SHARP_LIBVIPS_VERSION}-${this.platform}.tar.gz`

    Channel.debug(`OS缓存是否可写: ${FileCache.cacheDir}`)

    Channel.divider()
    Channel.info(`${i18n.t('core.dep_cache_dir')}: ${FileCache.cacheDir}`)
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

      Channel.debug(`Installed cache types: ${cacheTypes?.length ? cacheTypes.join(',') : 'none'}`)

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
          await abortPromise(this._install.bind(this), {
            timeout: this.options.timeout,
            abortController,
          })
        } finally {
          // 隐藏左下角状态栏
          this._hideStatusBar()
        }

        Channel.info(`✅ ${i18n.t('prompt.initialized')}`, true)
        await this._tryCopyCacheToOs(this._cacheable)
      } else {
        Channel.info(`${i18n.t('core.load_from_cache')}: ${cacheTypes[0]}`)
      }

      this._initCacheJson()

      const pkg = this._readCacheJson()

      Channel.debug(`Cached package.json: ${JSON.stringify(pkg)}`)

      if (pkg.libvips !== SHARP_LIBVIPS_VERSION) {
        fs.emptyDirSync(path.resolve(this.getDepCacheDir(), VENDOR))
        if (await this._tryCopyCacheToOs([VENDOR], { force: true })) {
          Channel.info(i18n.t('core.libvips_diff'))
        }
        this._writeCacheJson({ libvips: SHARP_LIBVIPS_VERSION })
      }

      const SHARP_VERSION = cleanVersion(devDependencies['@minko-fe/sharp'])
      if (pkg.sharp !== SHARP_VERSION) {
        fs.emptyDirSync(path.resolve(this.getDepCacheDir(), BUILD))
        if (await this._tryCopyCacheToOs([BUILD], { force: true })) {
          Channel.info(i18n.t('core.sharp_diff'))
        }
        this._writeCacheJson({ sharp: SHARP_VERSION })
      }

      if (pkg.version !== version) {
        if (await this._tryCopyCacheToOs(this._cacheable)) {
          Channel.info(i18n.t('core.version_diff'))
        }
        this._writeCacheJson({ version })
      }

      const currentCacheType = this._getInstalledCacheTypes()![0]
      Channel.debug(`Current cache type: ${currentCacheType}`)
      this.event.emit('install-success', await this._pollingLoadSharp(currentCacheType))
    } catch (e) {
      this.event.emit('install-fail', e as Error)
    }
    return this
  }

  private _initCacheJson() {
    let shouldInit = false
    if (!fs.existsSync(this._cacheFilePath)) {
      fs.ensureFileSync(this._cacheFilePath)
      shouldInit = true
    } else {
      const pkgRaw = fs.readFileSync(this._cacheFilePath, 'utf-8')
      if (!pkgRaw) {
        shouldInit = true
      }
    }
    if (shouldInit) {
      this._writeCacheJson({
        version,
        libvips: SHARP_LIBVIPS_VERSION,
        sharp: cleanVersion(devDependencies['@minko-fe/sharp']),
      })
    }
  }

  private _readCacheJson() {
    const pkgStr = fs.readFileSync(this._cacheFilePath, 'utf-8')
    let pkg: { version?: string; libvips?: string; sharp?: string } = {}
    if (isString(pkgStr)) {
      try {
        pkg = destrUtil.destr<AnyObject>(pkgStr)
      } catch {}
    }
    return pkg
  }

  private _writeCacheJson(value: Record<string, string>) {
    fs.writeJSONSync(this._cacheFilePath, {
      ...this._readCacheJson(),
      ...value,
    })
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
    const cachedFiles = [
      {
        key: 'releaseDirPath',
        value: `${BUILD}/Release`,
      },
      {
        key: 'vendorDirPath',
        value: `${VENDOR}/${SHARP_LIBVIPS_VERSION}`,
      },
      {
        key: 'sharpFsPath',
        value: 'sharp/index.js',
      },
    ]

    const caches = [
      {
        type: CacheType.os,
        cwd: this.getDepCacheDir(),
        exists: FileCache.osCachable,
      },
      {
        type: CacheType.extension,
        cwd: this.getSharpCwd(),
        exists: true,
      },
    ]
      .filter(({ exists }) => !!exists)
      .map(({ type, cwd }) => {
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

          const RETRY = i18n.t('prompt.retry')

          window.showErrorMessage(i18n.t('prompt.load_sharp_failed'), RETRY).then(async (res) => {
            if (res === RETRY) {
              try {
                await this.clearCaches()
              } catch {}
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

  private async _tryCopyCacheToOs(
    cacheDirs: string[],
    options: {
      force?: boolean
    } = {},
  ) {
    if (!FileCache.osCachable) return false
    const { force } = options
    if (!this._isCached || force) {
      // Ensure the existence of the cache directory
      fs.ensureDirSync(this.getDepCacheDir())

      // Copy stable files to cache directory
      await this._copyDirsToOsCache(cacheDirs)
      if (!force) this._isCached = true
    }
    return true
  }

  private _copyDirsToOsCache(dirs: string[]) {
    Channel.debug(`Copy [${dirs.join(',')}] to ${this.getDepCacheDir()}`)

    return Promise.all(
      dirs.map(async (dir) => {
        const source = path.resolve(this.getSharpCwd(), dir)
        if (fs.existsSync(source)) {
          await fs.copy(path.resolve(this.getSharpCwd(), dir), path.resolve(this.getDepCacheDir(), dir))
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
    return normalizePath(path.resolve(this.cwd, 'dist/lib'))
  }

  /**
   * 获取缓存中依赖的目录路径
   * @returns
   * /{tmpdir}/vscode-image-manager-cache/lib
   * or
   * /{homedir}/vscode-image-manager-cache/lib
   * or
   * /{extension-cwd}/dist/lib
   */
  public getDepCacheDir() {
    return normalizePath(path.resolve(FileCache.cacheDir, 'lib'))
  }

  private async _rm(path: string) {
    if (fs.existsSync(path)) {
      await fs.rm(path, { recursive: true })
    }
  }

  public async clearCaches() {
    Promise.all([
      () => {
        if (FileCache.osCachable) {
          // 如果有系统级缓存，清除
          this._rm(this.getDepCacheDir())
        }
      },
      // 清除 extension cache
      ...[VENDOR, BUILD, CACHE_JSON].map((dir) => this._rm(path.resolve(this.getSharpCwd(), dir))),
    ])
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

    const sharpBinaryReleaseDir = path.resolve(this.cwd, 'releases')

    Channel.debug(`sharpBinaryReleaseDir: ${sharpBinaryReleaseDir}`)

    // 如果扩展根目录有 libvips 的 .tar.gz 文件，用户可能有意手动安装依赖
    const libvipsBins = fs.readdirSync(this.cwd).filter((file) => /^libvips.+\.tar\.gz$/.test(file))

    const sharpBins = fs.readdirSync(sharpBinaryReleaseDir).filter((file) => /^sharp.+\.tar\.gz$/.test(file))

    const manualInstallSuccess = {
      libvips: false,
    }

    if (libvipsBins.length) {
      Channel.info(`libvips ${i18n.t('core.start_manual_install')}: ${libvipsBins.join(', ')}`)
      for (let i = 0; i < libvipsBins.length; i++) {
        // 尝试手动安装
        try {
          await execaNode('install/unpack-libvips.js', [path.join(this.cwd, libvipsBins[i])], {
            cwd,
            env: {
              ...process.env,
            },
          })
          manualInstallSuccess.libvips = true
          Channel.info(`${i18n.t('core.manual_install_success')}: ${libvipsBins[i]}`)
          break
        } catch {
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
