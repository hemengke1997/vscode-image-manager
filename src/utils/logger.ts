import { createConsola, LogLevels } from 'consola'
import { Config } from '~/core'

const logger = createConsola({
  level: (() => {
    if (Config.debug_enabled) return LogLevels.debug
    return process.env.NODE_ENV === 'production' ? LogLevels.box : LogLevels.debug
  })(),
})

export default logger
