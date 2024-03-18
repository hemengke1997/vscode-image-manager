import { LogLevels, createConsola } from 'consola'

const logger = createConsola({
  level: process.env.NODE_ENV === 'production' ? LogLevels.box : LogLevels.debug,
})

export default logger
