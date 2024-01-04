import { type ConfigType } from '.'

export const defaultConfig: ConfigType = {
  root: '',
  warningSize: 500,
  imageDefaultWidth: 100,
  scaleStep: 0.1,
  exclude: [],
  imageType: ['svg', 'png', 'jpeg', 'jpg', 'ico', 'gif', 'webp', 'bmp', 'tif', 'apng'],
}
