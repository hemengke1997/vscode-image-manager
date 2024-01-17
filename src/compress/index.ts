import { type Context } from '@rootSrc/Context'
import { Log } from '@rootSrc/utils/Log'
import { type AbsCompressor } from './AbsCompressor'
import { Compressor } from './Compressos'

let loading = false
export function initCompressor(ctx: Context): Promise<AbsCompressor> {
  if (loading) return Promise.reject('Initing compressor')

  loading = true
  const {
    config: { compress },
  } = ctx

  return new Promise((resolve) => {
    new Compressor(compress.method, {
      quality: compress.quality,
      replace: compress.replace,
      tinypngKey: compress.tinypngKey,
    })
      .init()
      .then((compressor) => {
        compressor.getInstance().then((c) => {
          Log.info(`Compressor init success ${c.name}`)
          ctx.setCompressor(c)
          resolve(c)
          loading = false
        })
      })
      .catch(() => {
        loading = false
      })
  })
}
