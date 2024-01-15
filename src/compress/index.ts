import { type Context } from '@rootSrc/Context'
import { Log } from '@rootSrc/utils/Log'
import { Compressor } from './Compressos'

export function initCompressor(ctx: Context) {
  const {
    config: { compress },
  } = ctx

  new Compressor(compress.method, {
    quality: compress.quality,
    replace: compress.replace,
    tinypngKey: compress.tinypngKey,
  })
    .init()
    .then((compressor) => {
      Log.info(`Use [${compressor.method}] as compressor`)
      ctx.setCompressor(compressor.getInstance())
    })
}
