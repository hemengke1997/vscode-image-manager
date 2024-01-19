import type SharpType from 'sharp'
import fs from 'fs-extra'
import path from 'node:path'
import { detectSharp } from '@/utils'
import { AbsCompressor, type CompressOptions, type CompressorMethod } from '../AbsCompressor'

class Sharp extends AbsCompressor {
  name: CompressorMethod = 'sharp'

  public static DEFAULT_CONFIG = {
    exts: ['.png', '.jpg', '.jpeg', '.webp', '.gif', 'tiff', 'avif'],
    maxLimit: 20 * 1024 * 1024, // 20MB
  }

  constructor(public compressOptions: CompressOptions) {
    super(compressOptions, {
      exts: Sharp.DEFAULT_CONFIG.exts,
      sizeLimit: Sharp.DEFAULT_CONFIG.maxLimit,
    })
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
  ): Promise<
    { filePath: string; originSize?: number | undefined; compressedSize?: number | undefined; error?: any }[]
  > {
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
      return {
        error: e,
        filePath,
      }
    }
  }

  private async _streamSharp(filePath: string): Promise<{ originSize: number; compressedSize: number }> {
    const originSize = fs.statSync(filePath).size

    return new Promise((resolve, reject) => {
      const ouputPath = this.getOutputPath(filePath)

      const ext = path.extname(filePath).slice(1)

      this._loadSharp()(filePath)
        .toFormat(ext as keyof SharpType.FormatEnum, {
          quality: this.compressOptions.quality,
          compressionLevel: this.compressOptions.compressionLevel,
        })
        .toBuffer()
        .then(async (buffer) => {
          try {
            const fileWritableStream = fs.createWriteStream(this.getOutputPath(filePath))

            fileWritableStream.on('finish', () => {
              const compressedSize = fs.statSync(ouputPath).size

              resolve({
                originSize,
                compressedSize,
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
        })
    })
  }

  private _loadSharp(): typeof SharpType {
    const _sharp = require('sharp')
    return _sharp
  }
}

export { Sharp }
