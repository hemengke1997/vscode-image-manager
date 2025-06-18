import { type ConsolaInstance, createConsola, LogLevels } from 'consola'
import { isNode } from 'es-toolkit'

type LoggerInstance = ConsolaInstance & {
  time: (label: string) => void
  timeEnd: (label: string) => void
}

const logger = createConsola({
  level: (() => {
    let env: string
    if (isNode()) {
      // eslint-disable-next-line node/prefer-global/process
      env = process.env.NODE_ENV!
    }
    else {
      env = import.meta.env.MODE
    }

    return env === 'development' ? LogLevels.debug : LogLevels.box
  })(),
}) as LoggerInstance

logger.time = (label: string) => {
  if (logger.level === LogLevels.debug) {
    // eslint-disable-next-line no-console
    console.time(label)
  }
}

logger.timeEnd = (label: string) => {
  if (logger.level === LogLevels.debug) {
    // eslint-disable-next-line no-console
    console.timeEnd(label)
  }
}

export default logger
