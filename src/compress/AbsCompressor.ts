import fs from 'fs-extra'
import path from 'node:path'

export type CompressOptions = {
  /**
   * @description sharp only
   * use the lowest number of colours needed to achieve given quality, sets palette to true
   * @default 80
   */
  quality: number
  /**
   * @description sharp only
   * zlib compression level, 0 (fastest, largest) to 9 (slowest, smallest)
   * @default 9
   */
  compressionLevel?: number
  replace?: boolean
  fileSuffix?: string
}

export type CompressConfig = {
  exts: string[]
  sizeLimit: number
}

export type CompressorMethod = 'sharp' | 'tinypng' | 'tinypngFree'

export abstract class AbsCompressor {
  abstract name: CompressorMethod

  constructor(
    public compressOptions: CompressOptions,
    public config: CompressConfig,
  ) {}

  abstract compress(filePaths: string[]): Promise<
    {
      filePath: string
      originSize?: number
      compressedSize?: number
      error?: any
    }[]
  >

  abstract validate(): Promise<boolean>

  getOutputPath(targetPath: string) {
    const { replace } = this.compressOptions

    const outputPath = replace ? targetPath : this._generateOutputPath(targetPath)

    return outputPath
  }

  getFilename(filePath: string) {
    const { name } = path.parse(filePath)
    return name
  }

  async tryCompressable(filePath: string) {
    const isValid = await this.validate()
    if (!isValid) {
      return Promise.reject('compressor is not valid')
    }

    return new Promise((resolve, reject) => {
      if (this._isCompressable(filePath)) {
        return resolve(true)
      }

      reject(
        `file ${this.getFilename(filePath)} is not a valid image. Only support ${this.config.exts.join(
          ', ',
        )} and size <= ${this.config.sizeLimit / 1024 / 1024}MB`,
      )
    })
  }

  private _isCompressable(filePath: string) {
    const fileStat = fs.statSync(filePath)
    return (
      fileStat.isFile() && this.config.exts.includes(path.extname(filePath)) && fileStat.size <= this.config.sizeLimit
    )
  }

  private _generateOutputPath(filePath: string, suffix = this.compressOptions.fileSuffix || '.min') {
    const { name, ext, dir } = path.parse(filePath)
    const filename = `${name}${suffix}`
    const outputPath = `${dir}/${filename}${ext}`

    const fileExists = fs.existsSync(outputPath)

    if (fileExists) {
      return this._generateOutputPath(outputPath)
    }
    return outputPath
  }
}
