import fs from 'fs-extra'
import mime from 'mime/lite'
import path from 'node:path'
import tinify from 'tinify'
import { Log } from '@/utils/Log'
import { AbsCompressor, type CommonOptions, type CompressinOptions, type CompressorMethod } from '../AbsCompressor'

type TinypngOptions = {
  apiKey: string
}

interface TinypngCompressionOptions extends CompressinOptions {
  /**
   * @description output format
   * @example 'png'
   */
  format: string
}

class TinyPng extends AbsCompressor<TinypngCompressionOptions> {
  name: CompressorMethod = 'tinypng'
  option: TinypngCompressionOptions

  public static DEFAULT_CONFIG = {
    exts: ['png', 'jpg', 'jpeg', 'webp'],
    max: 5 * 1024 * 1024, // 5MB
  }

  constructor(
    public commonOptions: CommonOptions,
    options: TinypngOptions,
  ) {
    super(commonOptions, {
      exts: TinyPng.DEFAULT_CONFIG.exts,
      sizeLimit: TinyPng.DEFAULT_CONFIG.max,
    })

    tinify.key = options.apiKey

    this.option = {
      format: '',
      keep: 0,
    }
  }

  validate(): Promise<boolean> {
    return new Promise((resolve) => {
      tinify.validate((err: Error | null) => {
        if (err) {
          Log.error(`Tinypng key is invalid: ${err.message}`)
          resolve(false)
        } else {
          resolve(true)
        }
      })
    })
  }

  compress(
    filePaths: string[],
    option: TinypngCompressionOptions,
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
    const res = Promise.all(filePaths.map((filePath) => this.tiny_compress(filePath)))
    return res
  }

  async tiny_compress(filePath: string) {
    try {
      await this.tryCompressable(filePath)

      const originSize = fs.statSync(filePath).size
      const newFilePath = await this.tinifyFile(filePath)

      return {
        originSize,
        compressedSize: fs.statSync(newFilePath).size,
        filePath,
        outputPath: newFilePath,
      }
    } catch (e) {
      return {
        error: e,
        filePath,
      }
    }
  }

  private _supportedConvertExts = ['png', 'jpg', 'jpeg', 'webp']

  async tinifyFile(filePath: string): Promise<string> {
    let { format } = this.option
    if (!this._supportedConvertExts.includes(format)) {
      format = path.extname(filePath).slice(1)
    }

    Log.info(`Tinify compress option: ${JSON.stringify(this.option)}`)

    return new Promise((resolve, reject) => {
      try {
        tinify
          .fromFile(filePath)
          .convert({
            type: mime.getType(format),
          })
          .toBuffer((err, buffer) => {
            if (err) {
              if (err instanceof tinify.AccountError) {
                reject('Authentication failed. Have you set the API Key?')
              }
              if (err instanceof tinify.ClientError) {
                reject('Check your source image and request options.')
              }
              if (err instanceof tinify.ServerError) {
                reject('Temporary issue with the Tinify API. Please try again later.')
              }
              if (err instanceof tinify.ConnectionError) {
                reject('A network connection error occurred.')
              }
              reject(err)
            }

            const outputPath = this.getOutputPath(filePath, format)

            try {
              this.trashFile(filePath)
              const fileWritableStream = fs.createWriteStream(outputPath)
              fileWritableStream.write(buffer)
              fileWritableStream.on('finish', () => {
                resolve(outputPath)
              })
              fileWritableStream.end()
            } catch (e) {
              reject(e)
            }
          })
      } catch (e) {
        reject(e)
      }
    })
  }
}

export { TinyPng }
