import type { CSSProperties } from 'react'
import type { CompressionOptions } from '../operator/compressor/type'
import type { FormatConverterOptions } from '../operator/format-converter'
import { Language, ReduceMotion, Theme } from '~/meta'

export type VscodeConfigType = {
  theme: Theme
  language: Language
  reduceMotion: ReduceMotion
}

export type ConfigType = {
  core: {
    multiplePanels: boolean
    installDependencies: boolean
  }
  debug: {
    enabled: boolean
    forceInstall: boolean
  }
  viewer: {
    warningSize: number
    // 图片样式
    imageWidth: number
    imageBackgroundColor: string
    imageRendering: CSSProperties['imageRendering']
    showDetailsOnHover: boolean
  }
  file: {
    exclude: string[]
    scan: string[]
    gitignore: boolean
    confirmDelete: boolean
    revealFileInOsDeeply: boolean
    trashAfterProcessing: boolean
  }
  appearance: {
    theme: Theme
    language: Language
    reduceMotion: ReduceMotion
    primaryColor: string
  }
  compression: CompressionOptions & {
    errorRange: number
  }
  conversion: FormatConverterOptions
  similarity: {
    precision: number
  }
}

export enum ConfigKey {
  core_multiplePanels = 'core.multiplePanels',
  core_installDependencies = 'core.installDependencies',

  debug_enabled = 'debug.enabled',
  debug_forceInstall = 'debug.forceInstall',

  viewer_warningSize = 'viewer.warningSize',
  viewer_imageWidth = 'viewer.imageWidth',
  viewer_imageBackgroundColor = 'viewer.imageBackgroundColor',
  viewer_imageRendering = 'viewer.imageRendering',
  viewer_showDetailsOnHover = 'viewer.showDetailsOnHover',

  file_exclude = 'file.exclude',
  file_scan = 'file.scan',
  file_gitignore = 'file.gitignore',
  file_confirmDelete = 'file.confirmDelete',
  file_revealFileInOsDeeply = 'file.revealFileInOsDeeply',
  file_trashAfterProcessing = 'file.trashAfterProcessing',

  appearance_theme = 'appearance.theme',
  appearance_language = 'appearance.language',
  appearance_primaryColor = 'appearance.primaryColor',
  appearance_reduceMotion = 'appearance.reduceMotion',

  compression = 'compression',
  compression_errorRange = 'compression.errorRange',
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
  conversion_icoSize = 'conversion.icoSize',

  similarity_precision = 'similarity.precision',
}

// !! Care: sync with package.json
export const DEFAULT_CONFIG: ConfigType = {
  core: {
    multiplePanels: false,
    installDependencies: true,
  },
  debug: {
    enabled: false,
    forceInstall: false,
  },
  viewer: {
    warningSize: 0,
    imageWidth: 100,
    imageBackgroundColor: '#1a1a1a',
    imageRendering: 'auto',
    showDetailsOnHover: true,
  },
  file: {
    scan: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'tiff', 'tif', 'avif', 'heif', 'heic', 'apng', 'svg', 'bmp', 'ico'],
    gitignore: true,
    exclude: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.nuxt/**',
      '**/.vercel/**',
      '**/.idea/**',
    ],
    confirmDelete: true,
    revealFileInOsDeeply: false,
    trashAfterProcessing: false,
  },
  appearance: {
    theme: Theme.auto,
    language: Language.auto,
    primaryColor: '',
    reduceMotion: ReduceMotion.auto,
  },
  compression: {
    errorRange: 0,
    keepOriginal: false,
    skipCompressed: true,
    fileSuffix: '.min',
    quality: 75,
    size: 1,
    format: '',
    png: {
      compressionLevel: 9,
    },
    gif: {
      colors: 256,
    },
    svg: {
      compressedAttribute: 'c', // data-c. "c" means "compressed"
      removeDataAttributes: true,
    },
  },
  conversion: {
    format: '',
    keepOriginal: false,
    icoSize: [16, 32],
  },
  similarity: {
    precision: 10,
  },
}
