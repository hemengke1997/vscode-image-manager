import { isString } from '@minko-fe/lodash-pro'
import fs from 'fs-extra'
import path from 'node:path'
import { Uri, workspace } from 'vscode'
import { i18n } from '~/i18n'
import { generateOutputPath } from '~/utils'
import { Channel } from '~/utils/channel'

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
  /**
   * 是否跳过了操作
   */
  isSkiped?: boolean
  /**
   * 图片类型是否被限制支持
   */
  isLimited?: boolean
}[]

export abstract class Operator {
  public abstract limit: {
    from: string[]
    to: string[]
    size: number
  }

  public abstract option: OperatorOptions

  abstract run<T extends OperatorOptions>(filePaths: string[], option: T | undefined): Promise<OperatorResult>

  private _isSupported(filePath: string) {
    const ext = this.getFileExt(filePath)
    const { size } = fs.statSync(filePath)

    if (!this.limit.from.includes(ext)) {
      return i18n.t('core.compress_fail_reason_extension', ext)
    }
    if (size >= this.limit.size) {
      return i18n.t('core.compress_fail_reason_size', this.limit.size / 1024 / 1024)
    }

    return true
  }

  public checkLimit(filePath: string) {
    const res = this._isSupported(filePath)
    if (isString(res)) {
      return Promise.reject(new LimitError(res))
    }
    return Promise.resolve(true)
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

export class LimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LimitError'
  }
}
