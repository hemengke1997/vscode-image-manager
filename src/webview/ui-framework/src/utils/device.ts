import { device, os } from 'un-detector'

function getUA() {
  return navigator.userAgent
}

export const OS = {
  isAndroid: () => os.isAndroid(getUA()),
  isIOS: () => os.isIOS(getUA()),
  isMac: () => os.isMac(getUA()),
  isWindows: () => os.isWindows(getUA()),
  isMobile: () => device.isMobile(getUA()),
}
