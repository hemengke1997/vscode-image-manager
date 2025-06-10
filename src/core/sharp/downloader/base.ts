import fs from 'fs-extra'
import { nanoid } from 'nanoid'
import fetch from 'node-fetch'
import os from 'node:os'
import path from 'node:path'
import stream from 'node:stream'
import util from 'node:util'
import zlib from 'node:zlib'
import pAny from 'p-any'
import pTimeout from 'p-timeout'
import tarFs from 'tar-fs'
import { type Promisable } from 'type-fest'
import { FileCache } from '~/core/file-cache'
import { Global } from '~/core/global'
import { i18n } from '~/i18n'
import { slashPath } from '~/utils'
import logger from '~/utils/logger'
import { Channel } from '~/utils/node/channel'
import { agent } from './agent'

const pipeline = util.promisify(stream.pipeline)

export abstract class BaseDownloader {
  // 包名称
  abstract name: string
  // 包版本
  abstract version: string
  // 包解压后目录
  abstract dest: string

  hosts = [
    'https://registry.npmmirror.com/-/binary',
    'https://npmmirror.com/mirrors',
    'https://cdn.npmmirror.com/binaries',
    '',
  ]

  /**
   * 生成下载地址
   */
  abstract generateDownloadUrls(): string[]

  /**
   * 探测用户本地是否存在已下载的二进制包
   * 如果有，表示用户期望手动安装，则不从远程下载
   */
  abstract detectUserLocalRelease(): Promisable<string[]>

  extensionCwd = Global.context.extensionUri.fsPath
  osCacheDir = slashPath(path.join(FileCache.cacheDir, 'lib/src'))
  extensionCacheDir = slashPath(path.join(this.extensionCwd, 'dist/lib/src'))

  constructor(
    public options: {
      readCacheJson: () => Record<string, string>
      writeCacheJson: (cache: Record<string, string>) => Promisable<void>
    },
  ) {}

  /**
   * 把解压包添加到系统缓存中
   */
  private async addToOsCache() {
    if (FileCache.osCachable) {
      await fs.ensureDir(path.join(this.osCacheDir, this.dest))
      await fs.copy(path.join(this.extensionCacheDir, this.dest), path.join(this.osCacheDir, this.dest))

      this.options.writeCacheJson({
        [this.name]: this.version,
      })
    }
  }

  /**
   * 如果version和本地缓存版本不一致，则需要更新
   */
  private shouldUpdate() {
    const cache = this.options.readCacheJson()

    if (!cache[this.name]) return false
    if (cache[this.name] !== this.version) {
      return true
    }
    return false
  }

  /**
   * 判断是否已经安装
   */
  async isInstalled() {
    let isInstalled = false
    if (this.shouldUpdate()) {
      isInstalled = false
    } else {
      const extensionCacheDir = path.join(this.extensionCacheDir, this.dest)
      const osCacheDir = path.join(this.osCacheDir, this.dest)

      try {
        isInstalled = await pAny(
          [extensionCacheDir, osCacheDir].map(async (dir) => {
            const files = await fs.readdir(dir)
            return Boolean(files.length)
          }),
        )
      } catch {
        // 插件缓存/本地缓存都不存在
        isInstalled = false
      }
    }

    Channel.debug(`${this.name} is already installed: ${isInstalled}`)

    if (!isInstalled) {
      this.warmTip()
    }

    return isInstalled
  }

  /**
   * 安装
   */
  async install() {
    let success = false
    // 检测用户本地是否有已下载的二进制包
    const userLocalReleases = await this.detectUserLocalRelease()
    if (userLocalReleases.length) {
      Channel.info(`Discover Local Resource of ${this.name}, start installing...`)
      await Promise.all(
        userLocalReleases.map((release) =>
          this.extractRelease({
            tarPath: release,
            dest: path.join(this.extensionCacheDir, this.dest),
            clean: false,
          }),
        ),
      )
      success = true
    }
    if (!success) {
      // 如果没有用户本地的二进制包，则从远程下载
      Channel.info(`No Local Resource of ${this.name}, start downloading...`)
      await this.download()
    }
  }

  /**
   * 下载并安装
   */
  private async download() {
    const urls = this.generateDownloadUrls()
    const abortController = new AbortController()

    const buffer = await pAny(
      urls.map(async (url) => {
        Channel.debug(`Downloading ${this.name} from: ${url}`)
        const buffer = await pTimeout(this.downloadRelease(url), {
          milliseconds: 30 * 1000,
          signal: abortController.signal,
        })
        abortController.abort()
        Channel.info(`${this.name} installed from: ${url}`)
        return buffer
      }),
    )

    const tarTempPath = path.join(os.tmpdir(), `${process.pid}-${this.name}-${nanoid(6)}`)
    await fs.writeFile(tarTempPath, Buffer.from(buffer))
    await this.extractRelease({
      tarPath: tarTempPath,
      dest: path.join(this.extensionCacheDir, this.dest),
    })

    Channel.info(`${this.name} downloaded and extracted to: ${this.dest}`)
  }

  /**
   * 下载远程二进制包
   */
  private async downloadRelease(url: string) {
    const res = await fetch(url, {
      agent: agent(logger.log),
    })
    if (res.ok) {
      const data = await res.arrayBuffer()
      return data
    } else {
      throw new Error(`Failed to download release from ${url}: ${res.status} ${res.statusText}`)
    }
  }

  /***
   * 解压下载后的包到指定目录
   */
  private async extractRelease(options: { tarPath: string; dest: string; clean?: boolean }) {
    const { tarPath, dest, clean = true } = options

    await pipeline(fs.createReadStream(tarPath), zlib.createGunzip(), tarFs.extract(dest))
    logger.info(`Extracted ${tarPath} to ${dest}`)

    if (clean) {
      // 删除临时文件
      fs.rm(tarPath, { force: true, recursive: true }).then(() => {
        Channel.debug(`Removed temporary file: ${tarPath}`)
      })
    }

    this.addToOsCache()
  }

  /**
   * 温馨提示
   */
  private warmTip() {
    Channel.divider()
    Channel.info(`${i18n.t('core.tip')}: ${i18n.t('core.dep_url_tip')} ⬇️`)
    this.generateDownloadUrls().forEach((url) => {
      Channel.info(`${i18n.t('core.dep_url')}: ${url}`)
    })
    Channel.divider()
  }
}
