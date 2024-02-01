import { type Context } from '@/Context'
import { Log } from '@/utils/Log'
import { type AbsCompressor } from './AbsCompressor'
import { Compressor } from './Compressos'

export async function initCompressor(ctx: Context, depsInstalled = false, onSuccess?: (c: AbsCompressor) => void) {
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
