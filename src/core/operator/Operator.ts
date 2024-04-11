import fs from 'fs-extra'
import path from 'node:path'
import { Uri, workspace } from 'vscode'
import { i18n } from '~/i18n'
import { generateOutputPath } from '~/utils'
import { Channel } from '~/utils/Channel'

export type OperatorOptions = {
  /**
   * @description whether keep original image file
   * @default false
   */
  keepOriginal?: boolean
}

export type OperatorResult = {
  filePath: string
  inputSize?: number
  outputSize?: number
  outputPath?: string
  error?: any
}[]

export abstract class Operator {
  public limit: {
    extensions: string[]
    size: number
  } = {
    extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'tiff', 'avif', 'heif'],
    size: 20 * 1024 * 1024,
  }

  public abstract option: OperatorOptions

  abstract run<T extends OperatorOptions>(filePaths: string[], option: T | undefined): Promise<OperatorResult>

  private _isSupported(filePath: string) {
    const ext = this.getFileExt(filePath)
    const { size } = fs.statSync(filePath)

    return this.limit.extensions.includes(ext) && size <= this.limit.size
  }

  public checkLimit(filePath: string) {
    if (this._isSupported(filePath)) {
      return Promise.resolve(true)
    }
    return Promise.reject(
      i18n.t('core.compress_fail_reason', this.getFilename(filePath), this.limit.size / 1024 / 1024),
    )
  }

  public getFilename(filePath: string) {
    const { name } = path.parse(filePath)
    return name
  }

  public getFileExt(filePath: string) {
    return path.extname(filePath).slice(1)
  }

  async trashFile(filePath: string) {
    try {
      if (this.option.keepOriginal) return
      await workspace.fs.delete(Uri.file(filePath), { useTrash: true })
    } catch (e) {
      Channel.info(`Trash File Error: ${e}`)
    }
  }

  public getOutputPath(
    sourcePath: string,
    outputOptions: {
      ext: string
      size: number
      fileSuffix: string
    } = {
      ext: '',
      size: 1,
      fileSuffix: '',
    },
  ): string {
    const { ext, size, fileSuffix } = outputOptions
    const { keepOriginal } = this.option || {}

    let outputPath = sourcePath
    if (size !== 1) {
      outputPath = generateOutputPath(outputPath, `@${size}x`)
    }

    if (keepOriginal && fileSuffix) {
      outputPath = generateOutputPath(outputPath, fileSuffix)
    }

    return this.changeExt(outputPath, ext)
  }

  public changeExt(filePath: string, ext?: string) {
    if (ext) {
      return filePath.replace(new RegExp(`${this.getFileExt(filePath)}$`), ext)
    }
    return filePath
  }

  public getFileSize(filePath: string) {
    return fs.statSync(filePath).size
  }
}
