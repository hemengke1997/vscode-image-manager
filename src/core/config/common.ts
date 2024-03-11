import { Colors } from '~/webview/ImageManager/utils/color'

export type ConfigType = {
  viewer: {
    warningSize: number
    imageWidth: number
    imageBackgroundColor: string
  }
  file: {
    root: string[]
    exclude: string[]
    scan: string[]
  }

  appearance: {
    theme: Theme | 'auto'
    language: Language | 'auto'
  }
}

// !! Care: sync with package.json
export const defaultConfig: ConfigType = {
  viewer: {
    warningSize: 1024,
    imageWidth: 100,
    imageBackgroundColor: Colors.warmBlack, // #1a1a1a
  },
  file: {
    root: [],
    scan: ['svg', 'png', 'jpeg', 'jpg', 'ico', 'gif', 'webp', 'bmp', 'tif', 'apng', 'tiff', 'avif'],
    exclude: [],
  },
  appearance: {
    theme: 'auto',
    language: 'auto',
  },
}

export enum ConfigKey {
  viewer_warningSize = 'viewer.warningSize',
  viewer_imageWidth = 'viewer.imageWidth',
  viewer_imageBackgroundColor = 'viewer.imageBackgroundColor',

  file_root = 'file.root',
  file_exclude = 'file.exclude',
  file_scan = 'file.scan',

  appearance_theme = 'appearance.theme',
  appearance_language = 'appearance.language',
}
