import fs from 'fs-extra'
import path from 'node:path'
import { Log } from '@/utils/Log'

export type CommonOptions = {
  fileSuffix?: string
}

export type CompressConfig = {
  exts: string[]
  sizeLimit: number
}

export type CompressorMethod = 'sharp' | 'tinypng' | 'tinypngFree'

export interface CompressinOptions {
  /**
   * @description whether keep original
   * @default 0
   */
  keep?: 0 | 1
}

export abstract class AbstractCompressor<CO extends CompressinOptions = CompressinOptions> {
  public abstract name: CompressorMethod
  public abstract option: CO

  constructor(
    public commonOptions: CommonOptions,
    public config: CompressConfig,
  ) {}

  abstract compress(
    filePaths: string[],
    option?: CO,
  ): Promise<
    {
      filePath: string
      originSize?: number
      compressedSize?: number
      outputPath?: string
      error?: any
    }[]
  >

  abstract validate(): Promise<boolean>

  async trashFile(filePath: string) {
    try {
      if (this.option.keep) return
      await fs.remove(filePath)
    } catch (e) {
      Log.info(`Trash File Error: ${e}`)
    }
  }

  getOutputPath(sourcePath: string, ext?: string, size?: number) {
    const { keep } = this.option || {}

    let outputPath = sourcePath
    if (size !== 1) {
      outputPath = this._generateOutputPath(outputPath, `@${size}x`)
    }

    if (keep) {
      outputPath = this._generateOutputPath(outputPath, this.commonOptions.fileSuffix || '.min')
    }

    return this._changeExt(outputPath, ext)
  }

  private _changeExt(filePath: string, ext?: string) {
    if (ext) {
      return filePath.replace(new RegExp(`${path.extname(filePath).slice(1)}$`), ext)
    }
    return filePath
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

    if (this._isCompressable(filePath)) {
      return Promise.resolve(true)
    } else {
      return Promise.reject(
        `file [${this.getFilename(filePath)}] is not a valid image. Only support size <= ${this.config.sizeLimit / 1024 / 1024}MB`,
      )
    }
  }

  private _isCompressable(filePath: string) {
    const fileStat = fs.statSync(filePath)
    return fileStat.isFile() && fileStat.size <= this.config.sizeLimit
  }

  private _generateOutputPath(
    filePath: string,
    suffix: string,
    //  = this.commonOptions.fileSuffix || '.min'
  ) {
    const { name, ext, dir } = path.parse(filePath)
    const filename = `${name}${suffix}`
    const outputPath = `${dir}/${filename}${ext}`

    const fileExists = fs.existsSync(outputPath)

    if (fileExists) {
      return this._generateOutputPath(outputPath, suffix)
    }
    return outputPath
  }
}
