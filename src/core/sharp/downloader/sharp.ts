import { globby } from 'globby'
import { runtimePlatformArch } from 'sharp/lib/libvips'
import { version } from 'sharp/package.json'
import { BaseDownloader } from './base'

export class SharpDownloader extends BaseDownloader {
  name = 'sharp'
  dest = ''
  version = version

  private genRemoteReleasePath() {
    return `v${this.version}/sharp-v${this.version}-napi-v9-${runtimePlatformArch()}.tar.gz`
  }

  async detectUserLocalRelease(): Promise<string[]> {
    const sharpBins = await globby('sharp-*.tar.gz', {
      cwd: this.extensionCwd,
      absolute: true,
      onlyFiles: true,
    })
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
