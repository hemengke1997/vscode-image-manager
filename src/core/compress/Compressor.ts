import type SharpType from 'sharp'
import { toString } from '@minko-fe/lodash-pro'
import fs from 'fs-extra'
import path from 'node:path'
import { SharpOperator } from '~/core/sharp'
import { Log } from '~/utils/Log'

type ExtendOptions = {
  fileSuffix?: string
}

export interface CompressionOptions {
  /**
   * @description whether keep original
   * @default 0
   */
  keep?: 0 | 1
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

export class Compressor {
  config = {
    exts: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'tiff', 'avif'],
    sizeLimit: 20 * 1024 * 1024, // 20MB
  }

  option: CompressionOptions

  constructor(private readonly _extendOptions?: ExtendOptions) {
    this.option = {
      compressionLevel: 9,
      quality: 100,
      size: 1,
      format: '',
      keep: 0,
    }
  }

  compress(
    filePaths: string[],
    option: CompressionOptions | undefined,
  ): Promise<
    {
      filePath: string
      originSize?: number
      compressedSize?: number
      outputPath?: string
      error?: any
    }[]
  > {
    this.option = option || this.option
    const res = Promise.all(filePaths.map((filePath) => this.compressImage(filePath)))

    return res
  }

  async compressImage(filePath: string) {
    try {
      await this.tryCompressable(filePath)
      const res = await this._stream(filePath)
      return {
        filePath,
        ...res,
      }
    } catch (e) {
      Log.info(`Compress Error: ${e}`)
      return {
        error: toString(e),
        filePath,
      }
    }
  }

  private async _stream(filePath: string): Promise<{ originSize: number; compressedSize: number; outputPath: string }> {
    const { format, compressionLevel, quality, size } = this.option!
    const ext = !format ? path.extname(filePath).slice(1) : format

    let operator = new SharpOperator({
      plugins: [
        {
          name: 'compress',
          hooks: {
            'before:run': async (sharp) => {
              const { width, height } = await sharp.metadata()
              sharp
                .toFormat(ext as keyof SharpType.FormatEnum, {
                  quality,
                  compressionLevel,
                })
                .withExif({
                  IFD0: {
                    ImageDescription: `compressed:true;`,
                  },
                })
                .timeout({ seconds: 20 })

              if (size !== 1) {
                sharp.resize({
                  width: width! * size,
                  height: height! * size,
                  fit: 'contain',
                })
              }

              return sharp
            },
            'after:run': async ({ outputPath }) => {
              if (filePath === outputPath) return
              await this._trashFile(filePath)
            },
            'on:genOutputPath': (inputPath) => {
              return this._getOutputPath(inputPath, ext, size)
            },
          },
        },
      ],
    })

    try {
      const result = await operator.run(filePath)
      if (result) {
        return {
          compressedSize: result.outputSize,
          originSize: result.inputSize,
          outputPath: result.outputPath,
        }
      } else {
        return Promise.reject('Compress Failed')
      }
    } catch (e) {
      if (e instanceof Error) {
        return Promise.reject(e.message)
      }
      return Promise.reject(e)
    } finally {
      // @ts-expect-error
      operator = null
    }
  }

  async tryCompressable(filePath: string) {
    if (this._isCompressable(filePath)) {
      return Promise.resolve(true)
    } else {
      return Promise.reject(
        `file [${this._getFilename(filePath)}] is not a valid image. Only support size <= ${this.config.sizeLimit / 1024 / 1024}MB`,
      )
    }
  }

  private _isCompressable(filePath: string) {
    const fileStat = fs.statSync(filePath)
    return fileStat.isFile() && fileStat.size <= this.config.sizeLimit
  }

  private _getOutputPath(sourcePath: string, ext?: string, size?: number) {
    const { keep } = this.option || {}

    let outputPath = sourcePath
    if (size !== 1) {
      outputPath = this._generateOutputPath(outputPath, `@${size}x`)
    }

    if (keep) {
      outputPath = this._generateOutputPath(outputPath, this._extendOptions?.fileSuffix || '.min')
    }

    return this._changeExt(outputPath, ext)
  }

  private _generateOutputPath(filePath: string, suffix: string) {
    const { name, ext, dir } = path.parse(filePath)
    const filename = `${name}${suffix}`
    const outputPath = `${dir}/${filename}${ext}`

    const fileExists = fs.existsSync(outputPath)

    if (fileExists) {
      return this._generateOutputPath(outputPath, suffix)
    }
    return outputPath
  }

  private async _trashFile(filePath: string) {
    try {
      if (this.option.keep) return
      await fs.remove(filePath)
    } catch (e) {
      Log.info(`Trash File Error: ${e}`)
    }
  }

  private _getFilename(filePath: string) {
    const { name } = path.parse(filePath)
    return name
  }

  private _changeExt(filePath: string, ext?: string) {
    if (ext) {
      return filePath.replace(new RegExp(`${path.extname(filePath).slice(1)}$`), ext)
    }
    return filePath
  }
}
