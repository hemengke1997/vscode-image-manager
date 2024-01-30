import type SharpType from 'sharp'
import { toString } from '@minko-fe/lodash-pro'
import path from 'node:path'
import { SharpOperator } from '@/operator/SharpOperator'
import { Log } from '@/utils/Log'
import { AbsCompressor, type CommonOptions, type CompressinOptions, type CompressorMethod } from '../AbsCompressor'

interface SharpCompressionOptions extends CompressinOptions {
  /**
   * @description
   * use the lowest number of colours needed to achieve given quality, sets palette to true
   * @default 100
   */
  quality?: number
  /**
   * @description
   * zlib compression level, 0 (fastest, largest) to 9 (slowest, smallest)
   * @default 9
   */
  compressionLevel?: number
  /**
   * @description output size
   * @example 1
   * @default 1
   */
  size: number
  /**
   * @description output format
   * @example 'png'
   * @default ''
   */
  format: string
}

export class Sharp extends AbsCompressor<SharpCompressionOptions> {
  name: CompressorMethod = 'sharp'
  option: SharpCompressionOptions
  operator: SharpOperator

  public static DEFAULT_CONFIG = {
    exts: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'tiff', 'avif'],
    maxLimit: 20 * 1024 * 1024, // 20MB
  }

  constructor(public commonOptions: CommonOptions) {
    super(commonOptions, {
      exts: Sharp.DEFAULT_CONFIG.exts,
      sizeLimit: Sharp.DEFAULT_CONFIG.maxLimit,
    })
    this.option = {
      compressionLevel: 9,
      quality: 100,
      size: 1,
      format: '',
      keep: 0,
    }

    this.operator = new SharpOperator()
  }

  validate(): Promise<boolean> {
    try {
      const usable = new SharpOperator().detectUsable()
      return Promise.resolve(usable)
    } catch {
      return Promise.resolve(false)
    }
  }

  compress(
    filePaths: string[],
    option: SharpCompressionOptions,
  ): Promise<
    {
      filePath: string
      originSize?: number
      compressedSize?: number
      outputPath?: string
      error?: any
    }[]
  > {
    this.option = option
    const res = Promise.all(filePaths.map((filePath) => this.sharp_compress(filePath)))

    return res
  }

  async sharp_compress(filePath: string) {
    try {
      await this.tryCompressable(filePath)
      const res = await this._streamSharp(filePath)
      return {
        filePath,
        ...res,
      }
    } catch (e) {
      Log.info(`Sharp Compress Error: ${e}`)
      return {
        error: toString(e),
        filePath,
      }
    }
  }

  private async _streamSharp(
    filePath: string,
  ): Promise<{ originSize: number; compressedSize: number; outputPath: string }> {
    const { format, compressionLevel, quality, size } = this.option!
    const ext = !format ? path.extname(filePath).slice(1) : format

    this.operator.use([
      {
        name: 'compress',
        hooks: {
          'before:run': async (sharp) => {
            return new Promise((resolve) => {
              sharp.metadata().then(({ width, height }) => {
                sharp.toFormat(ext as keyof SharpType.FormatEnum, {
                  quality,
                  compressionLevel,
                })
                if (size !== 1) {
                  sharp.resize({
                    width: width! * size,
                    height: height! * size,
                    fit: 'contain',
                  })
                }
                resolve(sharp)
              })
            })
          },
          'after:run': async ({ outputPath }) => {
            if (filePath === outputPath) return
            await this.trashFile(filePath)
          },
          'on:genOutputPath': (filePath) => {
            return this.getOutputPath(filePath, ext, size)
          },
        },
      },
    ])

    try {
      const result = await this.operator.run(filePath)
      if (result) {
        return {
          compressedSize: result.outputSize,
          originSize: result.inputSize,
          outputPath: result.outputPath,
        }
      } else {
        return Promise.reject(new Error('compress failed'))
      }
    } catch (e) {
      return Promise.reject(e)
    }
  }
}
