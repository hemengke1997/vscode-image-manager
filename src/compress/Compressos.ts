import { Log } from '@rootSrc/utils/Log'
import { type AbsCompressor, type CompressOptions, type CompressorMethod } from './AbsCompressor'
import { Sharp } from './sharp/Sharp'
import { initSharp } from './sharp/install'
import { TinyPng } from './tinypng/TinyPng'
import { TinypngFree } from './tinypng-free/TinypngFree'

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
        // fallback to tinypng if sharp is not available
        this.method = 'tinypng'
      }
    }
    return this
  }

  public async getInstance(): Promise<AbsCompressor> {
    const methodMap: Record<
      CompressorMethod,
      {
        compressor: AbsCompressor
        next: CompressorMethod
      }
    > = {
      sharp: {
        compressor: new Sharp(this.compressOptions),
        next: 'tinypng',
      },
      tinypng: {
        compressor: new TinyPng(this.compressOptions, { apiKey: this.compressOptions.tinypngKey! }),
        next: 'tinypngFree',
      },
      tinypngFree: {
        compressor: new TinypngFree(this.compressOptions),
        next: 'tinypngFree',
      },
    }
    try {
      const isValid = await methodMap[this.method].compressor.validate()

      Log.info(`Compressor ${this.method} is valid: ${isValid}`)

      if (isValid) {
        Log.info(`Use [${this.method}] as compressor`)
        return methodMap[this.method].compressor
      } else {
        Log.warn(`Compressor ${this.method} is not valid, fallback to ${methodMap[this.method].next}`)
        this.method = methodMap[this.method].next
        return await this.getInstance()
      }
    } catch (e) {
      Log.error(`Compressor ${this.method} init failed: ${e}`)
      return methodMap['tinypngFree'].compressor
    }
  }
}

export { Compressor }
