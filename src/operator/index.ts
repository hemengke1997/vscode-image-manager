import { type Context } from '@/Context'
import { Compressor } from '@/compress/Compressor'
import { Log } from '@/utils/Log'
import { Installer } from './Installer'

export function installOperator(ctx: Context) {
  const installer = new Installer(ctx)

  installer.event
    .on('install-success', () => {
      Log.info('Sharp creation success')
      Compressor.setCompressorToCtx(ctx, true)
    })
    .on('install-fail', () => {
      Log.error('Failed to install dependencies')
      Compressor.setCompressorToCtx(ctx, false)
    })

  installer.run()
}
