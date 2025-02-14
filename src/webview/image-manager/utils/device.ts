import { os } from 'un-detector'

function getUA() {
  return navigator.userAgent
}

export const OS = {
  isMac: os.isMac(getUA()),
  isWindows: os.isWindows(getUA()),
}
