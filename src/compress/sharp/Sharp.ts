import type SharpType from 'sharp'
import { round } from '@minko-fe/lodash-pro'
import fs from 'fs-extra'
import path from 'node:path'
import { detectSharp } from '@/utils'
import { Log } from '@/utils/Log'
import { AbsCompressor, type CommonOptions, type CompressinOptions, type CompressorMethod } from '../AbsCompressor'

interface SharpCompressionOptions extends CompressinOptions {
  /**
   * @description
   * use the lowest number of colours needed to achieve given quality, sets palette to true
   * @default 100
   */
  quality: number
  /**
   * @description
   * zlib compression level, 0 (fastest, largest) to 9 (slowest, smallest)
   * @default 9
   */
  compressionLevel: number
  /**
   * @description output size
   * @example 1
   * @default 1
   */
  size: number
  /**
   * @description output format
   * @example 'png'
   */
  format: string
}

class Sharp extends AbsCompressor<SharpCompressionOptions> {
  name: CompressorMethod = 'sharp'
  option: SharpCompressionOptions

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
  }

  validate(): Promise<boolean> {
    try {
      const sharp = detectSharp()
      return Promise.resolve(!!sharp)
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
      Log.info(`Sharp Compress Error: ${JSON.stringify(e)}`)
      return {
        error: e,
        filePath,
      }
    }
  }

  private async _streamSharp(
    filePath: string,
  ): Promise<{ originSize: number; compressedSize: number; outputPath: string }> {
    const { format, compressionLevel, quality, size } = this.option!

    const originSize = fs.statSync(filePath).size

    return new Promise((resolve, reject) => {
      const ext = !format ? path.extname(filePath).slice(1) : format
      const outputPath = this.getOutputPath(filePath, ext, size)

      const sharp = this._loadSharp()

      sharp(filePath)
        .metadata()
        .then(({ width, height }) =>
          sharp(filePath)
            .toFormat(ext as keyof SharpType.FormatEnum, {
              quality,
              compressionLevel,
            })
            .resize({
              width: round(width! * size),
              height: round(height! * size),
              fit: 'contain',
            })
            .toBuffer()
            .then(async (buffer) => {
              try {
                this.trashFile(filePath)

                const fileWritableStream = fs.createWriteStream(outputPath)

                fileWritableStream.on('finish', () => {
                  const compressedSize = fs.statSync(outputPath).size

                  resolve({
                    originSize,
                    compressedSize,
                    outputPath,
                  })
                })

                fileWritableStream.write(buffer)
                fileWritableStream.end()
              } catch (e) {
                reject(e)
              }
            })
            .catch((e) => {
              reject(e)
            }),
        )
        .catch((e) => {
          reject(e)
        })
    })
  }

  private _loadSharp(): typeof SharpType {
    const _sharp = require('sharp')
    return _sharp
  }
}

export { Sharp }
