import { Log } from '@rootSrc/utils/Log'
import { type CompressOptions } from './AbsCompressor'
import { Sharp } from './sharp/Sharp'
import { initSharp } from './sharp/install'
import { TinyPng } from './tinypng/TinyPng'
import { TinypngFree } from './tinypng-free/TinypngFree'

type CompressorMethod = 'sharp' | 'tinypng' | 'tinypngFree'

class Compressor {
  constructor(
    public method: CompressorMethod,
    public compressOptions: CompressOptions & {
      tinypngKey?: string
    },
  ) {}

  async init() {
    if (this.method === 'sharp') {
      let sharpEnable = false
      try {
        sharpEnable = await initSharp()
      } catch {
        sharpEnable = false
      }
      if (!sharpEnable) {
        this.method = 'tinypng'
        await this._ifApiKeyValid()
      }
    } else {
      await this._ifApiKeyValid()
    }

    return this._getInstance()
  }

  private async _ifApiKeyValid() {
    if (this.method === 'tinypng') {
      if (this.compressOptions.tinypngKey) {
        const tinypng = new TinyPng(this.compressOptions, {
          apiKey: this.compressOptions.tinypngKey,
        })
        try {
          await tinypng.validateApiKey()
        } catch {
          Log.error('Invalid tinypng key, fallback to Free mode', true)
          this.method = 'tinypngFree'
        }
      } else {
        this.method = 'tinypngFree'
      }
    }
  }

  private _getInstance() {
    switch (this.method) {
      case 'sharp':
        return new Sharp(this.compressOptions)
      case 'tinypng':
        return new TinyPng(this.compressOptions, { apiKey: this.compressOptions.tinypngKey! })
      case 'tinypngFree':
        return new TinypngFree(this.compressOptions)
      default:
        return new TinypngFree(this.compressOptions)
    }
  }
}

export { Compressor }
