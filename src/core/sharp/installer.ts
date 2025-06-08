import destr from 'destr'
import { isString } from 'es-toolkit'
import { EventEmitter } from 'eventemitter3'
import fs from 'fs-extra'
import path from 'node:path'
import { commands, StatusBarAlignment, type StatusBarItem, window } from 'vscode'
import { version } from '~root/package.json'
import { i18n } from '~/i18n'
import { setImmdiateInterval, slashPath } from '~/utils'
import { type AbortError, abortPromise, type TimeoutError } from '~/utils/abort-promise'
import logger from '~/utils/logger'
import { Channel } from '~/utils/node/channel'
import { Config } from '../config/config'
import { FileCache } from '../file-cache'
import { Global } from '../global'
import { type BaseDownloader } from './downloader/base'
import { LibvipsDownloader } from './downloader/libvips'
import { SharpDownloader } from './downloader/sharp'
import { SharpjsCache } from './sharpjs-cache'

export enum InstallEvent {
  success = 'install-success',
  fail = 'install-fail',
}

type Events = {
  [InstallEvent.success]: [TSharp]
  [InstallEvent.fail]: [TimeoutError | AbortError | Error]
}

export class Installer {
  /**
   * 扩展根目录
   */
  private cwd: string
  /**
   * 状态栏
   */
  private statusBarItem: StatusBarItem | undefined

  /**
   * 缓存 cache.json 文件路径
   */
  private cacheJson: string

  /**
   * livips下载器
   */
  private libvipsDownloader: LibvipsDownloader

  /**
   * sharp下载器
   */
  private sharpDownloader: SharpDownloader

  /**
   * sharpjs 缓存管理器
   */
  private sharpjsCache: SharpjsCache

  event: EventEmitter<Events> = new EventEmitter()

  constructor(
    public options: {
      timeout: number
    },
  ) {
    Channel.debug('Installer init')

    this.cwd = Global.context.extensionUri.fsPath

    this.cacheJson = path.join(this.libCacheDir, 'cache.json')

    this.libvipsDownloader = new LibvipsDownloader({
      readCacheJson: this.readCacheJson.bind(this),
      writeCacheJson: this.writeCacheJson.bind(this),
    })
    this.sharpDownloader = new SharpDownloader({
      readCacheJson: this.readCacheJson.bind(this),
      writeCacheJson: this.writeCacheJson.bind(this),
    })
    this.sharpjsCache = new SharpjsCache()

    Channel.debug(`os writable ${FileCache.cacheDir} : ${FileCache.osCachable}`)

    Channel.divider()
    Channel.info(`${i18n.t('core.dep_cache_dir')}: ${FileCache.cacheDir}`)
    Channel.info(`${i18n.t('core.extension_root')}: ${this.cwd}`)
    Channel.divider()
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
  public get libCacheDir() {
    return slashPath(path.resolve(FileCache.cacheDir, 'lib'))
  }

  private removeOldOsCache() {
    if (FileCache.osCachable) {
      // 删除 v3.2版本之前的旧本地缓存
      if (fs.existsSync(path.join(this.libCacheDir, 'vendor'))) {
        fs.rmSync(this.libCacheDir, { recursive: true, force: true })
      }
    }
  }

  async run() {
    const start = performance.now()
    this.removeOldOsCache()

    try {
      // 如果有cache.json，则是升级而非首次安装
      const isUpdate = fs.existsSync(this.cacheJson)

      this.initCacheJson()

      const [libvipsInstalled, sharpInstalled] = await Promise.all([
        this.libvipsDownloader.isInstalled(),
        this.sharpDownloader.isInstalled(),
      ])

      // 如果系统/扩展均无满足版本条件的缓存，则安装依赖
      if ([libvipsInstalled, sharpInstalled].some((t) => !t) || Config.debug_forceInstall) {
        const LoadingText = isUpdate ? i18n.t('prompt.updating') : i18n.t('prompt.initializing')

        // 显示左下角状态栏
        this.showStausBar(LoadingText)
        const abortController = new AbortController()
        const Cancel = i18n.t('prompt.cancel')

        window.showInformationMessage(LoadingText, Cancel).then((r) => {
          if (r === Cancel) {
            abortController.abort()
          }
        })

        try {
          const installSuccess = await abortPromise(this.install.bind(this), {
            timeout: this.options.timeout,
            abortController,
            params: {
              libvips: !libvipsInstalled || Config.debug_forceInstall,
              sharp: !sharpInstalled || Config.debug_forceInstall,
            },
          })

          if (!installSuccess) {
            const errMsg = i18n.t('core.dep_install_fail')
            Channel.error(errMsg, true)
            throw new Error(errMsg)
          }
        } finally {
          // 隐藏左下角状态栏
          this.hideStatusBar()
        }

        Channel.info(`✅ ${isUpdate ? i18n.t('prompt.updated') : i18n.t('prompt.initialized')}`, true)
      } else {
        Channel.info(`${i18n.t('core.load_from_cache')}`)
      }

      this.event.emit(InstallEvent.success, await this.pollingLoadSharp())
    } catch (e) {
      this.event.emit(InstallEvent.fail, e as Error)
    } finally {
      Channel.debug(`Install cost: ${performance.now() - start}ms`)
    }
    return this
  }

  private initCacheJson() {
    fs.ensureFileSync(this.cacheJson)
    this.writeCacheJson({ version })
  }

  private readCacheJson() {
    const pkgStr = fs.readFileSync(this.cacheJson, 'utf-8')
    let pkg: { version?: string } = {}
    if (isString(pkgStr)) {
      try {
        pkg = destr<AnyObject>(pkgStr)
      } catch {}
    }
    return pkg
  }

  private writeCacheJson(value: ReturnType<typeof this.readCacheJson>) {
    fs.writeJSONSync(this.cacheJson, {
      ...this.readCacheJson(),
      ...value,
    })
  }

  /**
   * 显示状态栏
   */
  private showStausBar(loadingText: string) {
    this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left)
    this.statusBarItem.text = `$(sync~spin) ${loadingText}`
    this.statusBarItem.tooltip = i18n.t('prompt.initializing_tooltip')
    this.statusBarItem.show()
  }

  /**
   * 隐藏状态栏
   */
  private hideStatusBar() {
    this.statusBarItem?.hide()
    this.statusBarItem?.dispose()
  }

  private async loadSharp() {
    const localSharpPath = this.sharpjsCache.getSharpPath()
    logger.info(`Load sharp from: ${localSharpPath}`)

    if (localSharpPath) {
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
    throw new Error(i18n.t('core.load_core_script_fail'))
  }

  private async pollingLoadSharp(maxTimes = 5) {
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

        Channel.debug(`Try polling load sharp: ${time} time`)
        try {
          const res = await this.loadSharp()
          if (res) {
            resolve(res)
            clearInterval(interval)
          }
        } catch (e) {
          logger.error(e)
          // 继续轮询
        }
      }, 250)
    })
  }

  public async clearCaches() {
    if (FileCache.osCachable) {
      // 如果有系统级缓存，清除
      try {
        await fs.rm(this.libCacheDir, { recursive: true, force: true })
      } catch (e) {
        logger.error(e)
      }
    }
  }

  private async install(options?: { libvips?: boolean; sharp?: boolean }) {
    const { libvips = true, sharp = true } = options || {}

    const downloaders: BaseDownloader[] = []

    if (libvips) {
      downloaders.push(this.libvipsDownloader)
    }
    if (sharp) {
      downloaders.push(this.sharpDownloader)
    }

    await Promise.all(downloaders.map((t) => t.install()))

    Channel.info(i18n.t('core.install_finished'))
    return true
  }
}
