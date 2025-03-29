import { config } from '@minko-fe/sharp/package.json'
import destr from 'destr'
import { isString } from 'es-toolkit'
import { toLower } from 'es-toolkit/compat'
import { EventEmitter } from 'eventemitter3'
import { execaNode } from 'execa'
import fs from 'fs-extra'
import path from 'node:path'
import pAny from 'p-any'
import { commands, StatusBarAlignment, type StatusBarItem, window } from 'vscode'
import { devDependencies, version } from '~root/package.json'
import { i18n } from '~/i18n'
import { cleanVersion, normalizePath, setImmdiateInterval } from '~/utils'
import { type AbortError, abortPromise, type TimeoutError } from '~/utils/abort-promise'
import { Channel } from '~/utils/channel'
import { Config } from '../config/config'
import { FileCache } from '../file-cache'
import { Global } from '../global'

export enum InstallEvent {
  success = 'install-success',
  fail = 'install-fail',
}

type Events = {
  [InstallEvent.success]: [TSharp]
  [InstallEvent.fail]: [TimeoutError | AbortError | Error]
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

// libvips 配置
const libvips_config = {
  /**
   * 解析名称，用于下载。固定而非自定义
   */
  name: 'sharp-libvips',
  /**
   * 版本
   */
  version: config.libvips,
}

// 缓存目录
enum CacheDirs {
  // vendor 里面是 libvips binary
  vendor = 'vendor',
  // build 里面是 sharp binary
  build = 'build',
  // sharp 里面是 sharp 的 index.js 源码
  sharp = 'sharp',
  // json 里面是 sharp 的 package.json
  json = 'json',
  // cache.json 里面是 ImageManager 插件版本、libvips 版本、@minko-fe/sharp 版本
  cache_json = 'cache.json',
}

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
   * 中国地区
   */
  private _isCN: boolean
  private _CN_host = [
    'https://registry.npmmirror.com/-/binary',
    'https://npmmirror.com/mirrors',
    'https://cdn.npmmirror.com/binaries',
  ]
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
  private readonly _cacheable = [CacheDirs.vendor, CacheDirs.build, CacheDirs.json, CacheDirs.sharp]

  event: EventEmitter<Events> = new EventEmitter()

  constructor(
    public options: {
      timeout: number
    },
  ) {
    Channel.debug('Installer init')
    // 如果语言是中文，视为中国地区，设置npm镜像
    const languages = [Config.appearance_language, Global.vscodeLanguage].map(toLower)
    this._isCN = languages.includes('zh-cn')

    this.cwd = Global.context.extensionUri.fsPath
    this.platform = require(path.resolve(this.getSharpCwd(), 'install/platform')).platform()

    this._cacheFilePath = path.join(this.getDepCacheDir(), CacheDirs.cache_json)

    this._libvips_bin = `libvips-${libvips_config.version}-${this.platform}.tar.gz`

    Channel.debug(`OS缓存是否可写: ${FileCache.cacheDir}`)

    Channel.divider()
    Channel.info(`${i18n.t('core.dep_cache_dir')}: ${FileCache.cacheDir}`)
    Channel.info(`${i18n.t('core.extension_root')}: ${this.cwd}`)
    Channel.info(`${i18n.t('core.tip')}: ${i18n.t('core.dep_url_tip')} ⬇️`)
    Channel.info(
      `${i18n.t('core.dep_url')}: ${this._CN_host[0]}/${libvips_config.name}/v${libvips_config.version}/${this._libvips_bin}`,
    )
    Channel.divider()
  }

  async run() {
    const start = performance.now()

    try {
      const cacheTypes = this._getInstalledCacheTypes()
      Channel.debug(`Installed cache types: ${cacheTypes?.length ? cacheTypes.join(',') : 'none'}`)

      const isUpdate = fs.existsSync(this._cacheFilePath)

      // 如果系统/扩展均无满足版本条件的缓存，则安装依赖
      if (!cacheTypes?.length || Config.debug_forceInstall) {
        const LoadingText = isUpdate ? i18n.t('prompt.updating') : i18n.t('prompt.initializing')

        // 显示左下角状态栏
        this._showStausBar(LoadingText)
        const abortController = new AbortController()
        const Cancel = i18n.t('prompt.cancel')
        window.showInformationMessage(LoadingText, Cancel).then((r) => {
          if (r === Cancel) {
            abortController.abort()
          }
        })
        try {
          const installSuccess = await abortPromise(this._install.bind(this), {
            timeout: this.options.timeout,
            abortController,
          })

          if (!Object.values(installSuccess).every(Boolean)) {
            const errMsg = i18n.t('core.dep_install_fail')
            Channel.error(errMsg, true)
            throw new Error(errMsg)
          }
        } finally {
          // 隐藏左下角状态栏
          this._hideStatusBar()
        }

        Channel.info(`✅ ${isUpdate ? i18n.t('prompt.updated') : i18n.t('prompt.initialized')}`, true)
        await this._tryCopyCacheToOs(this._cacheable)
      } else {
        Channel.info(`${i18n.t('core.load_from_cache')}: ${cacheTypes[0]}`)
      }

      this._initCacheJson()
      const pkg = this._readCacheJson()
      Channel.debug(`Cached package.json: ${JSON.stringify(pkg)}`)

      if (pkg.libvips !== libvips_config.version) {
        fs.emptyDirSync(path.resolve(this.getDepCacheDir(), CacheDirs.vendor))
        if (await this._tryCopyCacheToOs([CacheDirs.vendor])) {
          Channel.info(i18n.t('core.libvips_diff'))
        }
        this._writeCacheJson({ libvips: libvips_config.version })
      }

      const SHARP_VERSION = cleanVersion(devDependencies['@minko-fe/sharp'])
      if (pkg['@minko-fe/sharp'] !== SHARP_VERSION) {
        fs.emptyDirSync(path.resolve(this.getDepCacheDir(), CacheDirs.build))
        if (await this._tryCopyCacheToOs([CacheDirs.build, CacheDirs.sharp])) {
          Channel.info(i18n.t('core.sharp_diff'))
        }
        this._writeCacheJson({ '@minko-fe/sharp': SHARP_VERSION })
      }

      if (pkg.version !== version) {
        if (await this._tryCopyCacheToOs([CacheDirs.json])) {
          Channel.info(i18n.t('core.version_diff'))
        }
        this._writeCacheJson({ version })
      }

      const currentCacheType = this._getInstalledCacheTypes()![0]
      Channel.debug(`Current cache type: ${currentCacheType}`)
      this.event.emit(InstallEvent.success, await this._pollingLoadSharp(currentCacheType))
    } catch (e) {
      this.event.emit(InstallEvent.fail, e as Error)
    } finally {
      Channel.debug(`Install cost: ${performance.now() - start}ms`)
    }
    return this
  }

  /**
   * 初始化缓存 json 文件
   *
   * 包含：
   * - version: ImageManager 插件版本
   * - libvips 版本
   * - \@minko-fe/sharp 版本
   */
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
        'libvips': libvips_config.version,
        '@minko-fe/sharp': cleanVersion(devDependencies['@minko-fe/sharp']),
      })
    }
  }

  private _readCacheJson() {
    const pkgStr = fs.readFileSync(this._cacheFilePath, 'utf-8')
    let pkg: { 'version'?: string; 'libvips'?: string; '@minko-fe/sharp'?: string } = {}
    if (isString(pkgStr)) {
      try {
        pkg = destr<AnyObject>(pkgStr)
      } catch {}
    }
    return pkg
  }

  private _writeCacheJson(value: ReturnType<typeof this._readCacheJson>) {
    fs.writeJSONSync(this._cacheFilePath, {
      ...this._readCacheJson(),
      ...value,
    })
  }

  /**
   * 显示状态栏
   */
  private _showStausBar(loadingText: string) {
    this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left)
    Global.context.subscriptions.push(this._statusBarItem)
    this._statusBarItem.text = `$(sync~spin) ${loadingText}`
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
        value: `${CacheDirs.build}/Release`,
      },
      {
        key: 'vendorDirPath',
        value: `${CacheDirs.vendor}/${libvips_config.version}`,
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

  private async _pollingLoadSharp(cacheType: CacheType, maxTimes = 5) {
    let time = 0
    return new Promise<TSharp>((resolve, reject) => {
      const interval = setImmdiateInterval(async () => {
        time++

        if (time > maxTimes) {
          clearInterval(interval)

          const errMsg = i18n.t('prompt.load_sharp_failed')
          const RETRY = i18n.t('prompt.retry')
          window.showErrorMessage(errMsg, RETRY).then(async (res) => {
            if (res === RETRY) {
              try {
                await this.clearCaches()
              } catch {}
              commands.executeCommand('workbench.action.reloadWindow')
            }
          })
          return reject(errMsg)
        }

        Channel.debug(`Try polling load sharp: ${time} time, cacheType: ${cacheType}`)
        try {
          const res = await this._loadSharp(cacheType)
          if (res) {
            resolve(res)
            clearInterval(interval)
          }
        } catch {
          // 继续轮询
        }
      }, 250)
    })
  }

  /**
   * 把缓存复制到系统缓存目录
   */
  private async _tryCopyCacheToOs(cacheDirs: ValueOf<typeof CacheDirs>[]) {
    if (!FileCache.osCachable) return false
    // 确保缓存目录存在
    fs.ensureDirSync(this.getDepCacheDir())
    // 复制稳定文件到缓存目录
    try {
      await this._copyDirsToOsCache(cacheDirs)
    } catch {
      return false
    }
    return true
  }

  /**
   * 复制扩展缓存到系统缓存
   */
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
      ...[CacheDirs.vendor, CacheDirs.build, CacheDirs.cache_json].map((dir) =>
        this._rm(path.resolve(this.getSharpCwd(), dir)),
      ),
    ])
  }

  private async _install() {
    const cwd = this.getSharpCwd()

    const sharpBinaryReleaseDir = path.resolve(this.cwd, 'releases')

    Channel.debug(`sharpBinaryReleaseDir: ${sharpBinaryReleaseDir}`)

    // 如果扩展根目录有 libvips 的 .tar.gz 文件，用户可能有意手动安装依赖
    const libvipsBins = fs.readdirSync(this.cwd).filter((file) => /^libvips.+\.tar\.gz$/.test(file))

    const sharpBins = fs.readdirSync(sharpBinaryReleaseDir).filter((file) => /^sharp.+\.tar\.gz$/.test(file))

    const installSuccess = {
      libvips: false,
      sharp: false,
    }

    if (libvipsBins.length) {
      Channel.info(`libvips ${i18n.t('core.start_manual_install')}: ${libvipsBins.join(', ')}`)

      const abortController = new AbortController()

      await pAny(
        libvipsBins.map(async (bin) => {
          // 尝试手动安装
          await execaNode('install/unpack-libvips.js', [path.join(this.cwd, bin)], {
            cwd,
            env: {
              ...process.env,
            },
            stdio: 'inherit',
            signal: abortController.signal,
          })
          abortController.abort()
          installSuccess.libvips = true
          Channel.info(`${i18n.t('core.manual_install_success')}: ${bin}`)
        }),
      )
    }

    if (!installSuccess.libvips) {
      Channel.info(`libvips ${i18n.t('core.start_auto_install')}`)

      const hosts = this._isCN
        ? this._CN_host
        : [
            '', // 非中国地区
            // 中国地区被墙需要从镜像源下载
            ...this._CN_host,
          ]

      const abortController = new AbortController()

      const installLibvipsFromHost = async (url: string) => {
        const npm_config_sharp_libvips_binary_host = url ? new URL(`${url}/${libvips_config.name}`).toString() : url

        Channel.info(
          `Downloading libvips: ${npm_config_sharp_libvips_binary_host}/${libvips_config.name}/v${libvips_config.version}/${this._libvips_bin}`,
        )

        await execaNode('install/install-libvips.js', {
          cwd,
          env: {
            ...process.env,
            npm_package_config_libvips: libvips_config.version,
            npm_config_sharp_libvips_binary_host,
          },
          stdio: 'inherit',
          signal: abortController.signal,
        })
      }

      try {
        await pAny(
          hosts.map(async (host) => {
            await installLibvipsFromHost(host)
            Channel.info(`libvips installed from: ${host}`)
            abortController.abort()
            installSuccess.libvips = true
          }),
        )
      } catch (e: any) {
        Channel.error(e.message)
      }

      // 安装失败
      if (installSuccess.libvips === false) {
        Channel.error(`${i18n.t('core.manual_install_failed')}: ${this._libvips_bin}`)
        Channel.error(i18n.t('core.manual_install_failed'), true)
      }
    }

    await execaNode('install/dll-copy.js', {
      cwd,
      stdio: 'inherit',
    })

    if (sharpBins.length) {
      Channel.info(`sharp binary ${i18n.t('core.start_auto_install')}: ${sharpBins.join(', ')}`)

      const abortController = new AbortController()

      await pAny(
        sharpBins.map(async (bin) => {
          await execaNode(
            'install/unpack-sharp.js',
            [`--path=${cwd}`, `--binPath=${path.join(sharpBinaryReleaseDir, bin)}`],
            {
              cwd,
              signal: abortController.signal,
            },
          )
          abortController.abort()
          Channel.info(`${i18n.t('core.auto_install_success')}: ${bin}`)
          installSuccess.sharp = true
        }),
      )

      if (!installSuccess.sharp) {
        Channel.error(`sharp ${i18n.t('core.dep_install_fail')}`, true)
      }
    }

    Channel.info(i18n.t('core.install_finished'))
    return installSuccess
  }
}
