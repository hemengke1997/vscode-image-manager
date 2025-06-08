import fs from 'fs-extra'
import { runtimePlatformArch } from 'sharp/lib/libvips'
import { version } from 'sharp/package.json'
import { type Promisable } from 'type-fest'
import { BaseDownloader } from './base'

export class SharpDownloader extends BaseDownloader {
  name = 'sharp'
  dest = ''
  version = version

  private genRemoteReleasePath() {
    return `v${this.version}/sharp-v${this.version}-napi-v9-${runtimePlatformArch()}.tar.gz`
  }

  detectUserLocalRelease(): Promisable<string[]> {
    const sharpBins = fs.readdirSync(this.extensionCwd).filter((file) => /^sharp.+\.tar\.gz$/.test(file))
    return sharpBins
  }

  generateDownloadUrls(): string[] {
    return this.hosts.map((host) => {
      if (host) {
        // E.g. https://registry.npmmirror.com/-/binary/sharp/v0.32.4/sharp-0.32.4-napi-v9-darwin-arm64.tar.gz
        return new URL(`${host}/${this.name}/${this.genRemoteReleasePath()}`).toString()
      }
      // https://github.com/lovell/sharp/releases/download/v0.32.4/sharp-0.32.4-napi-v9-darwin-arm64.tar.gz
      return `https://github.com/lovell/sharp/releases/download/${this.genRemoteReleasePath()}`
    })
  }
}
