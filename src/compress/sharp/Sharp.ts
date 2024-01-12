import type SharpType from 'sharp'
import fs from 'node:fs'
import path from 'pathe'
import { AbsCompressor, type CompressOptions } from '../AbsCompressor'

class Sharp extends AbsCompressor {
  public static DEFAULT_CONFIG = {
    exts: ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
    maxLimit: 10 * 1024 * 1024, // 10MB
  }

  constructor(public compressOptions: CompressOptions) {
    super(compressOptions, {
      exts: Sharp.DEFAULT_CONFIG.exts,
      sizeLimit: Sharp.DEFAULT_CONFIG.maxLimit,
    })
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
    const sharp = this.loadSharp()

    return new Promise((resolve, reject) => {
      const ouputPath = this.getOutputPath(filePath)
      const fileWritableStream = fs.createWriteStream(ouputPath)

      const ext = path.extname(filePath).slice(1)
      const pipeline = sharp(filePath)
        .toFormat(ext as keyof SharpType.FormatEnum, {
          quality: this.compressOptions.quality,
        })
        .pipe(fileWritableStream)

      fileWritableStream.on('finish', () => {
        const compressedSize = fs.statSync(ouputPath).size
        resolve({
          originSize,
          compressedSize,
        })
      })

      pipeline.on('error', (err) => {
        reject(err)
      })
    })
  }

  public loadSharp(): typeof SharpType {
    const _sharp = require('sharp')
    return _sharp
  }
}

export { Sharp }
