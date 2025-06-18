import type { FormatConverterOptions } from '../format-converter'
import type { OperatorOptions } from '../operator'

export type CompressionOptions = OperatorOptions & {
  /**
   * @description 是否跳过已经压缩过的图片
   * @description skip if the image is already compressed
   * @default true
   */
  skipCompressed?: boolean
  /**
   * @description 添加的文件后缀
   * @description add suffix to the output file if `keepOriginal` is true
   * @default '.min'
   */
  fileSuffix?: string
  /**
   * @description 压缩后的图片质量
   * @description
   * use the lowest number of colours needed to achieve given quality, sets palette to true
   * @default 75
   */
  quality?: number
  /**
   * @description 压缩后的图片尺寸。比如，设置为 2，则输出图**尺寸**是原图的 2 倍
   * @description output size
   * @example 1
   * @default 1
   */
  size: number
  png: {
    /**
     * @description zlib压缩等级，0（最快，最大）到9（最慢，最小）
     * @description
     * zlib compression level, 0 (fastest, largest) to 9 (slowest, smallest)
     * @default 9
     */
    compressionLevel?: number
  }
  gif: {
    /**
     * @description 最大调色板条目数，包括透明度，介于2和256之间（可选，默认256）
     * @description
     * Maximum number of palette entries, including transparency, between 2 and 256 (optional, default 256)
     * for gif
     * @default 256
     */
    colors?: number
  }
} & Omit<FormatConverterOptions, 'icoSize'>
& SvgCompressionOptions<CustomSvgCompressionOptions>

export interface CustomSvgCompressionOptions {
  /**
   * @description 压缩svg后添加自定义属性，用于判断是否已经压缩过
   * 如果设置 null，则禁用功能
   * @default 'c' // compressed
   */
  compressedAttribute: string | null
  /**
   * @description 移除svg中的 data-* 属性（除了 data-*compressedAttribute*）
   * @default true
   */
  removeDataAttributes: boolean
}

export interface SvgCompressionOptions<T> {
  svg: T
}
