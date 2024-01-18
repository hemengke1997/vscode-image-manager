import { type Context } from '@rootSrc/Context'
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
        quality: compress.quality,
        replace: compress.replace,
        tinypngKey: compress.tinypngKey,
      },
      depsInstalled,
    )
      .init()
      .then((compressor) => {
        compressor.getInstance().then((c) => {
          ctx.setCompressor(c)
          onSuccess?.(c)
          resolve(c)
        })
      })
  })
}
