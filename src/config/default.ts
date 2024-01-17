import { type ConfigType } from '.'

export const defaultConfig: ConfigType = {
  root: [],
  warningSize: 1024,
  imageDefaultWidth: 100,
  scaleStep: 0.1,
  exclude: [],
  imageType: ['svg', 'png', 'jpeg', 'jpg', 'ico', 'gif', 'webp', 'bmp', 'tif', 'apng'],
  compress: {
    replace: true,
    quality: 80,
    method: 'tinypng',
    tinypngKey: '',
  },
}
