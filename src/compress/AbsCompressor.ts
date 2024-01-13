import fs from 'node:fs'
import path from 'node:path'

export type CompressOptions = {
  quality: number
  replace?: boolean
  fileSuffix?: string
}

export type CompressConfig = {
  exts: string[]
  sizeLimit: number
}

export abstract class AbsCompressor {
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

  getOutputPath(targetPath: string) {
    const { replace } = this.compressOptions

    const outputPath = replace ? targetPath : this._generateOutputPath(targetPath)

    return outputPath
  }

  getFilename(filePath: string) {
    const { name } = path.posix.parse(filePath)
    return name
  }

  tryCompressable(filePath: string) {
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
      fileStat.isFile() &&
      this.config.exts.includes(path.posix.extname(filePath)) &&
      fileStat.size <= this.config.sizeLimit
    )
  }

  private _generateOutputPath(filePath: string, suffix = this.compressOptions.fileSuffix || '.min') {
    const { name, ext, dir } = path.posix.parse(filePath)
    const filename = `${name}${suffix}`
    const outputPath = `${dir}/${filename}${ext}`

    const fileExists = fs.existsSync(outputPath)

    if (fileExists) {
      return this._generateOutputPath(outputPath)
    }
    return outputPath
  }
}
