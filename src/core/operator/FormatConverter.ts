import { merge } from '@minko-fe/lodash-pro'
import pMap from 'p-map'
import { type SharpNS } from '~/@types/global'
import { SharpOperator } from '..'
import { encode, resize } from '../sharp/Ico'
import { Operator, type OperatorOptions, type OperatorResult } from './Operator'

export type FormatConverterOptions = {
  /**
   * @description 输出的图片格式
   * @example 'png'
   * @default ''
   */
  format: string
  /**
   * @description ico 图片的尺寸
   * @default 32
   */
  icoSize: number
} & OperatorOptions

export class FormatConverter extends Operator {
  public limit: { extensions: string[]; size: number } = {
    extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'tiff', 'avif', 'heif', 'svg', 'ico'],
    size: 20 * 1024 * 1024,
  }

  constructor(public option: FormatConverterOptions) {
    super()
  }

  async run<FormatConverterOptions>(
    filePaths: string[],
    option: FormatConverterOptions | undefined,
  ): Promise<OperatorResult> {
    this.option = merge(this.option, option || {})
    const res = await pMap(
      filePaths.map((filePath) => () => this.convertImage(filePath)),
      (task) => task(),
    )
    return res
  }

  async convertImage(filePath: string) {
    try {
      await this.checkLimit(filePath)
      const res = await this.core(filePath)
      return {
        filePath,
        ...res,
      }
    } catch (error) {
      return { filePath, error }
    }
  }

  private async core(filePath: string): Promise<{ inputSize: number; outputSize: number; outputPath: string }> {
    const { format } = this.option!

    const originExt = this.getFileExt(filePath)
    const ext = !format ? originExt : format

    if (originExt === ext) {
      const fileSize = this.getFileSize(filePath)
      return Promise.resolve({
        inputSize: fileSize,
        outputSize: fileSize,
        outputPath: filePath,
      })
    }

    let converter: SharpOperator<{
      ext: string
      filePath: string
      option: FormatConverterOptions
    }> = new SharpOperator({
      plugins: [
        {
          name: 'format-converter',
          hooks: {
            'on:configuration': async (ctx) => {
              if (ctx.runtime.ext === 'gif') {
                return {
                  animated: true,
                  limitInputPixels: false,
                }
              }
            },
            'before:run': async (ctx) => {
              let { ext } = ctx.runtime
              if (ext === 'ico') {
                // resize
                ctx.sharp = await resize(ctx.sharp, { size: this.option.icoSize })
                ext = 'png'
              }
              ctx.sharp.toFormat(ext as keyof SharpNS.FormatEnum).timeout({ seconds: 20 })
            },
            'after:run': async ({ runtime: { filePath } }, { outputPath }) => {
              if (filePath === outputPath) return
              await this.trashFile(filePath)
            },
            'on:generate-output-path': ({ runtime: { ext, filePath } }) => {
              return this.getOutputPath(filePath, {
                ext,
                size: 1,
                fileSuffix: '',
              })
            },
            'on:write-buffer': async ({ runtime: { ext } }, buffer) => {
              if (ext === 'ico') {
                return encode([buffer])
              }
            },
          },
        },
      ],
    })

    try {
      const inputSize = this.getFileSize(filePath)
      const { outputPath } = await converter.run({
        ext,
        filePath,
        option: this.option,
        input: filePath,
      })

      const outputSize = this.getFileSize(outputPath)
      return {
        inputSize,
        outputSize,
        outputPath,
      }
    } catch (e) {
      return Promise.reject(e)
    } finally {
      // @ts-expect-error
      converter = null
    }
  }
}
