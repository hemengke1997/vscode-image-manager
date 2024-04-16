import { merge } from '@minko-fe/lodash-pro'
import pMap from 'p-map'
import { type SharpNS } from '~/@types/global'
import { SharpOperator } from '..'
import { Operator, type OperatorOptions, type OperatorResult } from './Operator'

export type FormatConverterOptions = {
  /**
   * @description output format
   * @example 'png'
   * @default ''
   */
  format: string
} & OperatorOptions

export class FormatConverter extends Operator {
  public limit: { extensions: string[]; size: number } = {
    extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'tiff', 'avif', 'heif', 'svg'],
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
            'before:run': async ({ sharp, runtime }) => {
              const { ext } = runtime

              sharp.toFormat(ext as keyof SharpNS.FormatEnum).timeout({ seconds: 20 })
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
