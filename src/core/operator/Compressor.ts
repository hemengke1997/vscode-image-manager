import { flatten, merge, toString } from '@minko-fe/lodash-pro'
import fs from 'fs-extra'
import { addMetadata, getMetadata } from 'meta-png'
import piexif from 'piexifjs'
import { optimize } from 'svgo'
import { type SharpNS } from '~/@types/global'
import { SharpOperator } from '~/core/sharp'
import { i18n } from '~/i18n'
import { VscodeMessageCenter } from '~/message'
import { isJpg, isPng } from '~/utils'
import { Channel } from '~/utils/Channel'
import logger from '~/utils/logger'
import { type FormatConverterOptions } from './FormatConverter'
import { Operator, type OperatorResult } from './Operator'
import { Svgo } from './Svgo'
import { COMPRESSED_META, type SvgoPlugin } from './meta'

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
   * @default 100
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
} & FormatConverterOptions &
  SvgCompressionOptions

export type SvgCompressionOptions = {
  svg: SvgoPlugin
}

export class Compressor extends Operator {
  constructor(public option: CompressionOptions) {
    super()
  }

  async run<CompressionOptions>(filePaths: string[], option: CompressionOptions | undefined): Promise<OperatorResult> {
    this.option = merge(this.option, option || {})

    const svgs: string[] = []
    const rest: string[] = []
    filePaths.forEach((filePath) => {
      if (this.getFileExt(filePath) === 'svg') {
        svgs.push(filePath)
      } else {
        rest.push(filePath)
      }
    })

    const res = await Promise.all(
      flatten([
        svgs.map((filePath) => this.compressSvg(filePath)),
        rest.map((filePath) => this.compressImage(filePath)),
      ]),
    )

    return res.filter((r) => {
      if (r.error === new SkipError().message) {
        return false
      }
      return true
    })
  }

  async compressImage(filePath: string) {
    try {
      try {
        await this.checkLimit(filePath)
      } catch (e) {
        logger.error(e)
      }
      const res = await this.core(filePath)
      return {
        filePath,
        ...res,
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : toString(e)
      Channel.info(`Compress Error: ${error}`)
      return {
        error,
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
    } catch (e) {
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

              const {
                compressed,
                metadata: { width, height },
              } = await VscodeMessageCenter.get_image_metadata({
                filePath,
              })

              if (skipCompressed && compressed) {
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
                })
                .timeout({ seconds: 20 })

              if (!isPng(ext) && !isJpg(ext)) {
                sharp.withMetadata({
                  exif: {
                    IFD0: {
                      ImageDescription: COMPRESSED_META,
                    },
                  },
                })
              }

              if (size !== 1) {
                sharp.resize({
                  width: width! * size,
                  height: height! * size,
                  fit: 'contain',
                })
              }
            },
            'after:run': async ({ runtime: { filePath } }, { outputPath }) => {
              if (filePath === outputPath) return
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
            'on:finish': async (_, { outputPath }) => {
              // add metadata
              let PNGUint8Array = new Uint8Array(fs.readFileSync(outputPath))
              if (isPng(outputPath)) {
                try {
                  const compressed = getMetadata(PNGUint8Array, COMPRESSED_META)
                  if (compressed) return
                  PNGUint8Array = addMetadata(PNGUint8Array, COMPRESSED_META, '1')
                } catch {}
                await fs.writeFile(outputPath, PNGUint8Array)
              } else if (isJpg(outputPath)) {
                let binary = fs.readFileSync(outputPath).toString('binary')
                binary = piexif.remove(binary)
                const zeroth = {}
                zeroth[piexif.ImageIFD.ImageDescription] = COMPRESSED_META
                const exifObj = { '0th': zeroth }
                const exifbytes = piexif.dump(exifObj)
                const buffer = Buffer.from(piexif.insert(exifbytes, binary), 'binary')
                await fs.writeFile(outputPath, buffer)
              }
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
