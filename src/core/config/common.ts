import { type CompressionOptions, type FormatConverterOptions } from '..'

export type VscodeConfigType = {
  theme: Theme
  language: Language
  reduceMotion: ReduceMotion
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
    confirmDelete: boolean
  }
  appearance: {
    theme: Theme
    language: Language
    reduceMotion: ReduceMotion
    primaryColor: string
  }
  mirror: {
    enabled: boolean
    url: string
  }
  compression: CompressionOptions & {
    saveCompressionData?: 'metadata' | 'none'
  }
  conversion: FormatConverterOptions
  similarity: {
    precision: number
  }
}

export const enum ConfigKey {
  viewer_warningSize = 'viewer.warningSize',
  viewer_imageWidth = 'viewer.imageWidth',
  viewer_imageBackgroundColor = 'viewer.imageBackgroundColor',

  file_root = 'file.root',
  file_exclude = 'file.exclude',
  file_scan = 'file.scan',
  file_confirmDelete = 'file.confirmDelete',

  appearance_theme = 'appearance.theme',
  appearance_language = 'appearance.language',
  appearance_primaryColor = 'appearance.primaryColor',
  appearance_reduceMotion = 'appearance.reduceMotion',

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
  compression_save_compression_data = 'compression.saveCompressionData',

  conversion = 'conversion',
  conversion_formt = 'conversion.formt',
  conversion_keepOriginal = 'conversion.keepOriginal',

  similarity_precision = 'similarity.precision',
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
    confirmDelete: true,
  },
  appearance: {
    theme: 'auto',
    language: 'auto',
    primaryColor: '',
    reduceMotion: 'auto',
  },
  mirror: {
    enabled: false,
    url: '',
  },
  compression: {
    // 保存压缩信息至图片的metadata中，可能会导致图片压缩后体积变大
    saveCompressionData: 'metadata',

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
  similarity: {
    precision: 10,
  },
}
