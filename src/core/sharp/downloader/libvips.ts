import fs from 'fs-extra'
import { runtimePlatformArch } from 'sharp/lib/libvips'
import { config } from 'sharp/package.json'
import { type Promisable } from 'type-fest'
import { cleanVersion } from '~/utils'
import { BaseDownloader } from './base'

export class LibvipsDownloader extends BaseDownloader {
  name = 'sharp-libvips'
  dest = `sharp-libvips-${runtimePlatformArch()}`
  version = cleanVersion(config.libvips)

  private genRemoteReleasePath() {
    const arch = process.arch
    let armVersion = ''
    if (arch === 'arm') {
      const fallback = process.versions.electron ? '7' : '6'
      armVersion = `v${process.env.npm_config_arm_version || fallback}`
    } else if (arch === 'arm64') {
      armVersion = `v${process.env.npm_config_arm_version || '8'}`
    }
    return `v${this.version}/libvips-${this.version}-${runtimePlatformArch()}${armVersion}.tar.gz`
  }

  detectUserLocalRelease(): Promisable<string[]> {
    const libvipsBins = fs.readdirSync(this.extensionCwd).filter((file) => /^libvips.+\.tar\.gz$/.test(file))
    return libvipsBins
  }

  generateDownloadUrls(): string[] {
    return this.hosts.map((host) => {
      if (host) {
        // E.g. https://registry.npmmirror.com/-/binary/sharp-libvips/v8.16.1/libvips-8.16.1-darwin-arm64v8.tar.gz
        return new URL(`${host}/${this.name}/${this.genRemoteReleasePath()}`).toString()
      }
      // https://github.com/lovell/sharp-libvips/releases/download/v8.16.1/libvips-8.16.1-darwin-arm64v8.tar.gz
      return `https://github.com/lovell/sharp-libvips/releases/download/${this.genRemoteReleasePath()}`
    })
  }
}
