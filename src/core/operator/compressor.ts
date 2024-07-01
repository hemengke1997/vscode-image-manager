import { isArray, mergeWith, toString } from '@minko-fe/lodash-pro'
import fs from 'fs-extra'
import pMap from 'p-map'
import { optimize } from 'svgo'
import { type SharpNS } from '~/@types/global'
import { SharpOperator } from '~/core/sharp'
import { i18n } from '~/i18n'
import { VscodeMessageCenter } from '~/message'
import { Channel } from '~/utils/channel'
import { type FormatConverterOptions } from './format-converter'
import { COMPRESSED_META, type SvgoPlugin } from './meta'
import { LimitError, Operator, type OperatorResult } from './operator'
import { Svgo } from './svgo'

export type CompressionOptions = {
  /**
   * @description skip if the image is already compressed
   * @default true
   */
  skipCompressed?: boolean
  /**
   * @description add suffix to the output file if `keepOriginal` is true
   * @default '.min'
   */
  fileSuffix?: string
  /**
   * @description
   * use the lowest number of colours needed to achieve given quality, sets palette to true
   * @default undefined
   */
  quality?: number
  /**
   * @description output size
   * @example 1
   * @default 1
   */
  size: number
  png: {
    /**
     * @description
     * zlib compression level, 0 (fastest, largest) to 9 (slowest, smallest)
     * @default 9
     */
    compressionLevel?: number
  }
  gif: {
    /**
     * @description
     * Maximum number of palette entries, including transparency, between 2 and 256 (optional, default 256)
     * for gif
     * @default 256
     */
    colors?: number
  }
} & Omit<FormatConverterOptions, 'icoSize'> &
  SvgCompressionOptions

export type SvgCompressionOptions = {
  svg: SvgoPlugin
}

export class Compressor extends Operator {
  private extensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'tiff', 'avif', 'heif']

  public limit = {
    from: [...this.extensions],
    to: [...this.extensions],
  }

  constructor(public option: CompressionOptions) {
    super()
  }

  async run<CompressionOptions>(filePaths: string[], option: CompressionOptions | undefined): Promise<OperatorResult> {
    this.option = mergeWith(this.option, option || {}, (_, srcValue) => {
      if (isArray(srcValue)) return srcValue
    })

    const svgs: string[] = []
    const rest: string[] = []
    filePaths.forEach((filePath) => {
      if (this.getFileExt(filePath) === 'svg') {
        svgs.push(filePath)
      } else {
        rest.push(filePath)
      }
    })

    const res = await pMap(
      [
        ...svgs.map((filePath) => () => this.compressSvg(filePath)),
        ...rest.map((filePath) => () => this.compressImage(filePath)),
      ],
      (task) => task(),
    )

    return res.map((r) => {
      const isSkiped = r.error instanceof SkipError
      const isLimited = r.error instanceof LimitError
      return {
        ...r,
        error: r.error ? r.error.message : toString(r.error),
        isSkiped,
        isLimited,
      }
    })
  }

  async compressImage(filePath: string) {
    try {
      await this.checkLimit(filePath)
      const res = await this.core(filePath)
      return {
        filePath,
        ...res,
      }
    } catch (e: any) {
      Channel.debug(`${i18n.t('core.compress_error')}: ${toString(e)}`)
      return {
        error: e,
        filePath,
      }
    }
  }

  async compressSvg(filePath: string) {
    try {
      const svgString = await fs.readFile(filePath, 'utf-8')
      const outputPath = this.getOutputPath(filePath, {
        ext: 'svg',
        size: 1,
        fileSuffix: '',
      })

      const svgoConfig = Svgo.processConfig(this.option.svg, {
        pretty: false,
      })

      const inputSize = this.getFileSize(filePath)

      const { data } = optimize(svgString, svgoConfig)

      // write data to file
      await fs.writeFile(outputPath, data)

      const outputSize = this.getFileSize(outputPath)

      return {
        filePath,
        inputSize,
        outputSize,
        outputPath,
      }
    } catch (e: any) {
      return {
        filePath,
        error: e,
      }
    }
  }

  private async core(filePath: string): Promise<{ inputSize: number; outputSize: number; outputPath: string }> {
    const { format } = this.option!

    const originExt = this.getFileExt(filePath)
    const ext = !format ? originExt : format

    let compressor: SharpOperator<{
      ext: string
      filePath: string
      option: CompressionOptions
    }> = new SharpOperator({
      plugins: [
        {
          name: 'compress',
          hooks: {
            'on:configuration': (ctx) => {
              if (ctx.runtime.ext === 'gif') {
                return {
                  animated: true,
                  limitInputPixels: false,
                }
              }
            },
            'before:run': async ({ sharp, runtime }) => {
              const {
                option: {
                  gif: { colors },
                  quality,
                  png: { compressionLevel },
                  size,
                  skipCompressed,
                },
                ext,
                filePath,
              } = runtime

              let imageMetadata = await VscodeMessageCenter.get_image_metadata({
                filePath,
              })

              if (!imageMetadata) {
                imageMetadata = {
                  compressed: false,
                  metadata: { width: 0, height: 0 } as SharpNS.Metadata,
                }
              }

              const {
                compressed,
                metadata: { width, height },
              } = imageMetadata!

              if (
                skipCompressed &&
                compressed &&
                // 格式没变的话跳过压缩
                originExt === ext
              ) {
                return Promise.reject(new SkipError())
              }

              const compressionOption = {
                quality,
                compressionLevel,
              }

              if (ext === 'gif') {
                compressionOption['colors'] = colors
              }

              sharp
                .toFormat(ext as keyof SharpNS.FormatEnum, {
                  ...compressionOption,
                  // 提高png的压缩率
                  palette: true,
                  // 提高jpeg的压缩率
                  mozjpeg: true,
                })
                .timeout({ seconds: 30 })

              sharp.withExifMerge({
                IFD0: {
                  ImageDescription: COMPRESSED_META,
                },
              })

              if (size !== 1) {
                sharp.resize({
                  width: width! * size,
                  height: height! * size,
                  fit: 'contain',
                })
              }
            },
            'after:run': async ({ runtime: { filePath } }) => {
              await this.trashFile(filePath)
            },
            'on:generate-output-path': ({
              runtime: {
                ext,
                option: { size },
                filePath,
              },
            }) => {
              return this.getOutputPath(filePath, {
                ext,
                size,
                fileSuffix: this.option.fileSuffix!,
              })
            },
          },
        },
      ],
    })

    try {
      const inputSize = this.getFileSize(filePath)
      const { outputPath } = await compressor.run({
        ext,
        filePath,
        option: this.option,
        input: filePath,
      })
      if (outputPath) {
        const outputSize = this.getFileSize(outputPath)
        return {
          outputSize,
          inputSize,
          outputPath,
        }
      } else {
        return Promise.reject(i18n.t('core.compress_fail'))
      }
    } catch (e) {
      return Promise.reject(e)
    } finally {
      // @ts-expect-error
      compressor = null
    }
  }
}

class SkipError extends Error {
  constructor() {
    super('Skip Compressed')
  }
}
