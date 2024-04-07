import { type CompressionOptions, type FormatConverterOptions } from '..'

export type VscodeConfigType = {
  theme: Theme
  language: Language
}

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
    theme: Theme
    language: Language
    primaryColor: string
  }
  mirror: {
    enabled: boolean
    url: string
  }
  compression: CompressionOptions
  conversion: FormatConverterOptions
}

export const enum ConfigKey {
  viewer_warningSize = 'viewer.warningSize',
  viewer_imageWidth = 'viewer.imageWidth',
  viewer_imageBackgroundColor = 'viewer.imageBackgroundColor',

  file_root = 'file.root',
  file_exclude = 'file.exclude',
  file_scan = 'file.scan',

  appearance_theme = 'appearance.theme',
  appearance_language = 'appearance.language',
  appearance_primaryColor = 'appearance.primaryColor',

  mirror_enabled = 'mirror.enabled',
  mirror_url = 'mirror.url',

  compression = 'compression',
  compression_keepOriginal = 'compression.keepOriginal',
  compression_skipCompressed = 'compression.skipCompressed',
  compression_fileSuffix = 'compression.fileSuffix',
  compression_quality = 'compression.quality',
  compression_size = 'compression.size',
  compression_format = 'compression.format',
  compression_png_compressionLevel = 'compression.png.compressionLevel',
  compression_gif_colors = 'compression.gif.colors',
  compression_svg = 'compression.svg',

  conversion = 'conversion',
  conversion_formt = 'conversion.formt',
  conversion_keepOriginal = 'conversion.keepOriginal',
}

// !! Care: sync with package.json
export const DEFAULT_CONFIG: ConfigType = {
  viewer: {
    warningSize: 1024,
    imageWidth: 100,
    imageBackgroundColor: '#1a1a1a', // #1a1a1a
  },
  file: {
    root: [],
    scan: ['svg', 'png', 'jpeg', 'jpg', 'ico', 'gif', 'webp', 'bmp', 'tif', 'apng', 'tiff', 'avif'],
    exclude: [],
  },
  appearance: {
    theme: 'auto',
    language: 'auto',
    primaryColor: '',
  },
  mirror: {
    enabled: false,
    url: '',
  },
  compression: {
    keepOriginal: false,
    skipCompressed: true,
    fileSuffix: '.min',
    quality: undefined,
    size: 1,
    format: '',
    png: {
      compressionLevel: 9,
    },
    gif: {
      colors: 256,
    },
    // svg 单向存储，不需要从webview同步到settings，所以不需要在此设置默认值
    svg: {},
  },
  conversion: {
    format: '',
    keepOriginal: false,
  },
}
