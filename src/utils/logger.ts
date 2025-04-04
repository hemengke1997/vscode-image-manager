import { type ConsolaInstance, createConsola, LogLevels } from 'consola'

type LoggerInstance = ConsolaInstance & {
  time: (label: string) => void
  timeEnd: (label: string) => void
}

const logger = createConsola({
  level: process.env.NODE_ENV === 'development' ? LogLevels.debug : LogLevels.box,
}) as LoggerInstance

logger.time = (label: string) => {
  if (logger.level === LogLevels.debug) {
    console.time(label)
  }
}

logger.timeEnd = (label: string) => {
  if (logger.level === LogLevels.debug) {
    console.timeEnd(label)
  }
}

export default logger
