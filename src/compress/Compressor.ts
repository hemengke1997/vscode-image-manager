import { type Context } from '@/Context'
import { Log } from '@/utils/Log'
import { type AbstractCompressor, type CommonOptions, type CompressorMethod } from './abstract/AbstractCompressor'
import { Sharp } from './sharp/Sharp'
import { TinyPng } from './tinypng/TinyPng'
import { TinypngFree } from './tinypng-free/TinypngFree'

const AbsortMessage = 'Absort Compressor instance'

export class Compressor {
  static StaticSymbolFlag: symbol
  private instanceSymbol: symbol

  constructor(
    public method: CompressorMethod,
    public commonOptions: CommonOptions & {
      tinypngKey?: string
    },
    private _depsInstalled = false,
  ) {
    Compressor.StaticSymbolFlag = this.instanceSymbol = Symbol('compressor')
  }

  static async setCompressorToCtx(ctx: Context, depsInstalled = false, onSuccess?: (c: AbstractCompressor) => void) {
    const {
      config: { compress },
    } = ctx

    try {
      const compressor = new Compressor(
        compress.method,
        {
          tinypngKey: compress.tinypngKey,
        },
        depsInstalled,
      )

      await compressor.init()
      const c = await compressor.getInstance()

      if (c) {
        ctx.setCompressor(c)
        onSuccess?.(c)
        return c
      }

      return Promise.reject('Failed to get compressor instance')
    } catch (e) {
      Log.info(`Init Compressor Error: ${e}`)
    }
  }

  async init() {
    if (this.method === 'sharp') {
      if (!this._depsInstalled) {
        // fallback to tinypng if sharp is not available
        this.method = 'tinypng'
      }
    }
    return this
  }

  private _ifAbsortInstance() {
    // If current instance is not the static instance,
    // means that the instance is not the latest one,
    // throw an error to absort the instance.
    if (Compressor.StaticSymbolFlag !== this.instanceSymbol) {
      throw new Error(AbsortMessage)
    }
  }

  public async getInstance(): Promise<AbstractCompressor | null> {
    Log.info(`Init compressor ${this.method}`)
    const methodMap: Record<
      CompressorMethod,
      {
        compressor: AbstractCompressor
        next: CompressorMethod
      }
    > = {
      sharp: {
        compressor: new Sharp(this.commonOptions),
        next: 'tinypng',
      },
      tinypng: {
        compressor: new TinyPng(this.commonOptions, { apiKey: this.commonOptions.tinypngKey! }),
        next: 'tinypngFree',
      },
      tinypngFree: {
        compressor: new TinypngFree(this.commonOptions),
        next: 'tinypngFree',
      },
    }

    try {
      const current = methodMap[this.method]

      const isValid = await current.compressor.validate()
      this._ifAbsortInstance()

      Log.info(`Compressor ${this.method} is valid: ${isValid}`)

      if (isValid) {
        Log.info(`Use [${this.method}] as compressor`)
        return current.compressor
      } else {
        Log.info(`Compressor ${this.method} is not valid, fallback to ${current.next}`)
        this.method = current.next
        return await this.getInstance()
      }
    } catch (e: any) {
      if (e instanceof Error && e.message === AbsortMessage) {
        return null
      } else {
        Log.info(`Compressor ${this.method} init failed: ${e}`)
        return methodMap['tinypngFree'].compressor
      }
    }
  }
}
