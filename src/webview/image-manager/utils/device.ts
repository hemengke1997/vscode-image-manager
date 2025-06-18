import { UAParser } from 'ua-parser-js'

const ua = new UAParser()

const isMac = ua.getOS().name === 'macOS'

export const OS = {
  isMac,
  isWindows: !isMac,
}
