import { toNumber } from 'es-toolkit/compat'
import fs from 'fs-extra'
import pMap from 'p-map'
import { type SharpNS } from '~/@types/global'
import { i18n } from '~/i18n'
import { type ImageManagerPanel } from '~/webview/panel'
import { DEFAULT_CONFIG } from '../config/common'
import { SharpOperator } from '../sharp/sharp-operator'
import { Operator, type OperatorOptions, type OperatorResult, SkipError } from './operator'

export type FormatConverterOptions = {
  /**
   * @description 输出的图片格式
   * @example 'png'
   * @default ''
   */
  format: string
  /**
   * @description ico图标兼容尺寸
   * @default
   * ```
   * [16, 32]
   * ```
   */
  icoSize: number[]
} & OperatorOptions

type ConvertorRuntime = {
  ext: string
  filePath: string
  option: FormatConverterOptions
  isLast: boolean
}

export class FormatConverter extends Operator {
  public inputPath: string = ''
  public outputPath: string = ''
  public inputBuffer: Buffer = Buffer.from('')

  public extensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'tiff', 'tif', 'avif', 'heif', 'svg']

  public limit = {
    from: [...this.extensions],
    to: [...this.extensions, 'ico'],
  }

  constructor(
    public option: FormatConverterOptions,
    public imageManagerPanel: ImageManagerPanel,
  ) {
    super()
  }

  async run<FormatConverterOptions>(
    image: ImageType,
    option: FormatConverterOptions | undefined,
  ): Promise<OperatorResult> {
    this.image = image
    this.option = this.mergeOption(option)
    this.inputPath = image.path

    const r = await this.convertImage(this.inputPath)

    return this.resolveResult(r)
  }

  async convertImage(filePath: string) {
    const result = {
      filePath,
    }
    try {
      await this.checkLimit(filePath)
      const res = await this.core(filePath)
      return {
        ...result,
        ...res,
      }
    } catch (error) {
      return { ...result, error: error || i18n.t('core.compress_fail_reason_unknown') }
    }
  }

  private createConverter(size?: number) {
    const converter: SharpOperator<ConvertorRuntime> = new SharpOperator({
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
              if (this.isIco(ext)) {
                //
                if (ctx.sharp) {
                  ctx.sharp = await this.resizeIco(ctx.sharp, { size: size! })
                }
                // convert to png first, then encode to ico
                ext = 'png'
              }
              ctx.sharp?.toFormat(ext as keyof SharpNS.FormatEnum).timeout({ seconds: 20 })
            },
            'after:run': async ({ runtime: { filePath, isLast } }) => {
              if (!this.option.keepOriginal) {
                isLast && (await this.deleteFile(filePath))
              }
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

    return converter
  }

  async core(
    filePath: string,
  ): Promise<{ inputSize: number; outputSize: number; outputPath: string; inputBuffer: Buffer }> {
    const { format } = this.option!

    const originExt = this.getFileExt(filePath)
    const ext = !format ? originExt : format

    // 保留原格式，跳过
    if (originExt === ext) {
      return Promise.reject(new SkipError())
    }

    const [inputBuffer, inputSize] = await Promise.all([fs.readFile(filePath), this.getFileSize(filePath)])

    let outputPath = ''
    let converters: SharpOperator<ConvertorRuntime>[] | SharpOperator<ConvertorRuntime>

    try {
      if (this.isIco(ext)) {
        if (!this.option.icoSize) {
          this.option.icoSize = DEFAULT_CONFIG.conversion.icoSize
        }
        converters = this.option.icoSize
          .map((size) => toNumber(size))
          .sort((a, b) => b - a)
          .map((size) => this.createConverter(size)) as SharpOperator<ConvertorRuntime>[]
        const len = converters.length
        const res = await pMap(
          converters.map(
            (converter, index) => () =>
              converter.run(
                {
                  ext,
                  filePath,
                  option: this.option,
                  input: filePath,
                  isLast: index === len - 1,
                },
                {
                  dryRun: true,
                },
              ),
          ),
          (task) => task(),
          {
            concurrency: 1,
          },
        )
        const icoBuffer = this.encodeIco(res.map((r) => r.buffer))
        // write ico file
        outputPath = res[0].outputPath
        await fs.writeFile(outputPath, icoBuffer)
      } else {
        converters = this.createConverter()
        const res = await converters.run({
          ext,
          filePath,
          option: this.option,
          input: filePath,
          isLast: true,
        })
        outputPath = res.outputPath
      }

      const outputSize = await this.getFileSize(outputPath)
      return {
        inputBuffer,
        inputSize,
        outputSize,
        outputPath,
      }
    } catch (e) {
      return Promise.reject(e)
    } finally {
      // @ts-expect-error
      converters = null
    }
  }

  private isIco(ext: string) {
    return ext === 'ico'
  }

  /**
   * @description encode ico
   */
  private encodeIco(bufferList: Buffer[]) {
    // ico-endec only support cjs
    const icoEndec = require('ico-endec')
    return icoEndec.encode(bufferList) as Buffer
  }

  /**
   * @description resize ico
   */
  private async resizeIco(
    image: SharpNS.Sharp,
    { size, resizeOptions }: { size: number; resizeOptions?: SharpNS.ResizeOptions },
  ) {
    return image.clone().resize({
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      ...resizeOptions,
      width: size,
      height: size,
    })
  }
}
