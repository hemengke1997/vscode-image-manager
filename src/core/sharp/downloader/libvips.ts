import process from 'node:process'
import { runtimePlatformArch } from 'sharp/lib/libvips'
import { config } from 'sharp/package.json'
import { cleanVersion } from '~/utils'
import { BaseDownloader } from './base'

export class LibvipsDownloader extends BaseDownloader {
  protected name = 'sharp-libvips'
  protected dest = `sharp-libvips-${runtimePlatformArch()}`
  protected version = cleanVersion(config.libvips)

  protected genRemoteReleaseName() {
    const arch = process.arch
    let armVersion = ''
    if (arch === 'arm') {
      const fallback = process.versions.electron ? '7' : '6'
      armVersion = `v${process.env.npm_config_arm_version || fallback}`
    }
    else if (arch === 'arm64') {
      armVersion = `v${process.env.npm_config_arm_version || '8'}`
    }
    return `v${this.version}/libvips-${this.version}-${runtimePlatformArch()}${armVersion}.tar.gz`
  }

  protected generateDownloadUrls(): string[] {
    return this.hosts.map((host) => {
      if (host) {
        // E.g. https://registry.npmmirror.com/-/binary/sharp-libvips/v8.16.1/libvips-8.16.1-darwin-arm64v8.tar.gz
        return new URL(`${host}/${this.name}/${this.genRemoteReleaseName()}`).toString()
      }
      // https://github.com/lovell/sharp-libvips/releases/download/v8.16.1/libvips-8.16.1-darwin-arm64v8.tar.gz
      return `https://github.com/lovell/sharp-libvips/releases/download/${this.genRemoteReleaseName()}`
    })
  }
}
