import { type Context } from '@/Context'
import { Log } from '@/utils/Log'
import { type AbsCompressor } from './AbsCompressor'
import { Compressor } from './Compressos'

export function initCompressor(
  ctx: Context,
  depsInstalled = false,
  onSuccess?: (c: AbsCompressor) => void,
): Promise<AbsCompressor> {
  const {
    config: { compress },
  } = ctx

  return new Promise((resolve) => {
    new Compressor(
      compress.method,
      {
        tinypngKey: compress.tinypngKey,
      },
      depsInstalled,
    )
      .init()
      .then((compressor) => {
        compressor.getInstance().then((c) => {
          if (c) {
            ctx.setCompressor(c)
            onSuccess?.(c)
            resolve(c)
          }
        })
      })
      .catch((e) => {
        Log.info(`Init Compressor Error: ${e}`)
      })
  })
}
