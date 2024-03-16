import { toString } from '@minko-fe/lodash-pro'
import fs from 'fs-extra'
import { addMetadata, getMetadata } from 'meta-png'
import path from 'node:path'
import piexif from 'piexifjs'
import { type SharpNS } from '~/@types/global'
import { SharpOperator } from '~/core/sharp'
import { VscodeMessageCenter } from '~/message'
import { generateOutputPath, isJpg, isPng } from '~/utils'
import { Log } from '~/utils/Log'
import { COMPRESSED_META } from './meta'

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
   * @description skip if the image is already compressed
   * @default 1
   */
  skipCompressed?: 0 | 1
  /**
   * @description
   * use the lowest number of colours needed to achieve given quality, sets palette to true
   * @default 80
   */
  quality?: number
  /**
   * @description
   * zlib compression level, 0 (fastest, largest) to 9 (slowest, smallest)
   * @default 9
   */
  compressionLevel?: number
  /**
   * @description
   * Maximum number of palette entries, including transparency, between 2 and 256 (optional, default 256)
   * for gif
   * @default 256
   */
  colors?: number
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
    exts: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'tiff', 'avif', 'heif'],
    sizeLimit: 20 * 1024 * 1024, // 20MB
  }
  option: CompressionOptions

  constructor(private readonly _extendOptions?: ExtendOptions) {
    this.option = {
      compressionLevel: 9,
      quality: 80,
      colors: 256,
      size: 1,
      format: '',
      keep: 0,
      skipCompressed: 0,
    }
  }

  async compress(
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
    const res = await Promise.all(filePaths.map((filePath) => this.compressImage(filePath)))

    return res.filter((r) => {
      if (r.error === new SkipError().message) {
        return false
      }
      return true
    })
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
      const error = e instanceof Error ? e.message : toString(e)
      Log.info(`Compress Error: ${error}`)
      return {
        error,
        filePath,
      }
    }
  }

  private async _stream(filePath: string): Promise<{ originSize: number; compressedSize: number; outputPath: string }> {
    const { format } = this.option!

    const originExt = path.extname(filePath).slice(1)
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
                option: { colors, quality, compressionLevel, size, skipCompressed },
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
              await this._trashFile(filePath)
            },
            'on:generate-output-path': ({
              runtime: {
                ext,
                option: { size },
                filePath,
              },
            }) => {
              return this._getOutputPath(filePath, ext, size)
            },
            'on:finish': async (_, { outputPath }) => {
              // add metadata
              if (isPng(outputPath)) {
                const PNGUint8Array = new Uint8Array(fs.readFileSync(outputPath))
                if (getMetadata(PNGUint8Array, COMPRESSED_META)) return
                const modified = addMetadata(PNGUint8Array, COMPRESSED_META, '1')
                await fs.writeFile(outputPath, modified)
              } else if (isJpg(outputPath)) {
                let binary = fs.readFileSync(outputPath).toString('binary')
                binary = piexif.remove(binary)
                const zeroth = {}
                zeroth[piexif.ImageIFD.ImageDescription] = COMPRESSED_META
                const exifObj = { '0th': zeroth }
                const exifbytes = piexif.dump(exifObj)
                const newData = Buffer.from(piexif.insert(exifbytes, binary), 'binary')
                await fs.writeFile(outputPath, newData)
              }
            },
          },
        },
      ],
    })

    try {
      const inputSize = fs.statSync(filePath).size
      const { outputPath } = await compressor.run({
        ext,
        filePath,
        option: this.option,
        input: filePath,
      })
      if (outputPath) {
        const outputSize = fs.statSync(outputPath).size

        return {
          compressedSize: outputSize,
          originSize: inputSize,
          outputPath,
        }
      } else {
        return Promise.reject('Compress Failed')
      }
    } catch (e) {
      return Promise.reject(e)
    } finally {
      // @ts-expect-error
      compressor = null
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
      outputPath = generateOutputPath(outputPath, `@${size}x`)
    }

    if (keep) {
      outputPath = generateOutputPath(outputPath, this._extendOptions?.fileSuffix || '.min')
    }

    return this._changeExt(outputPath, ext)
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

class SkipError extends Error {
  constructor() {
    super('Skip Compressed')
  }
}
