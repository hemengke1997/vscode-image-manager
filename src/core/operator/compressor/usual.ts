import type { Buffer } from 'node:buffer'
import type { CompressionOptions } from './type'
import type { SharpNS } from '~/@types/global'
import type { ImageManagerPanel } from '~/webview/panel'
import { round } from 'es-toolkit'
import fs from 'fs-extra'
import { SharpOperator } from '~/core/sharp/sharp-operator'
import { i18n } from '~/i18n'
import { Compressed } from '~/meta'
import { COMPRESSED_META } from '../meta'
import { SkipError } from '../operator'
import { Compressor } from './compressor'

export class UsualCompressor extends Compressor {
  public extensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'tiff', 'tif', 'avif', 'heif']
  public limit = {
    from: [...this.extensions],
    to: [...this.extensions],
  }

  constructor(
    public option: CompressionOptions,
    public imageManagerPanel: ImageManagerPanel,
  ) {
    super()
  }

  async core(
    filePath: string,
  ): Promise<{ inputSize: number, outputSize: number, outputPath: string, inputBuffer: Buffer }> {
    const { format } = this.option!

    const originExt = this.getFileExt(filePath)
    const ext = !format ? originExt : format

    const { info } = this.image

    let compressor: SharpOperator<{
      ext: string
      filePath: string
      option: CompressionOptions
    }> = new SharpOperator({
      plugins: [
        {
          name: 'compress',
          hooks: {
            'on:configuration': (ctx) => {
              if (ctx.runtime.ext === 'gif') {
                return {
                  animated: true,
                  limitInputPixels: false,
                }
              }
            },
            'before:run': async ({ sharp, runtime }) => {
              const {
                ext,
                option: {
                  gif: { colors },
                  quality,
                  png: { compressionLevel },
                  size,
                  skipCompressed,
                },
              } = runtime

              const {
                compressed,
                metadata: { width, height },
              } = info

              if (
                skipCompressed
                && compressed === Compressed.yes
                // 格式没变的话跳过压缩
                && originExt === ext
              ) {
                return Promise.reject(new SkipError())
              }

              const compressionOption = {
                quality,
                compressionLevel,

              }

              if (ext === 'gif') {
                Object.assign(compressionOption, {
                  colors,
                })
              }

              sharp
                ?.toFormat(ext as keyof SharpNS.FormatEnum, {
                  ...compressionOption,
                  // 提高png的压缩率
                  palette: true,
                  // 提高jpeg的压缩率
                  mozjpeg: true,
                })
                .timeout({ seconds: 10 })

              sharp?.withExifMerge({
                IFD0: {
                  ImageDescription: COMPRESSED_META,
                },
              })

              if (size !== 1) {
                sharp?.resize({
                  width: round(width! * size, 0),
                  height: round(height! * size, 0),
                  fit: 'contain',
                })
              }
            },
            'after:run': async ({ runtime: { filePath } }) => {
              if (!this.option.keepOriginal) {
                await this.deleteFile(filePath)
              }
            },
            'on:generate-output-path': async ({
              runtime: {
                ext,
                option: { size },
                filePath,
              },
            }) => {
              const outputPath = this.getOutputPath(filePath, {
                ext,
                size,
                fileSuffix: this.option.fileSuffix,
              })

              return outputPath
            },
          },
        },
      ],
    })

    try {
      const [inputSize, inputBuffer] = await Promise.all([this.getFileSize(filePath), fs.readFile(filePath)])
      const { outputPath } = await compressor.run({
        ext,
        filePath,
        option: this.option,
        input: filePath,
      })
      if (outputPath) {
        const outputSize = await this.getFileSize(outputPath)
        return {
          inputBuffer,
          outputSize,
          inputSize,
          outputPath,
        }
      }
      else {
        return Promise.reject(i18n.t('core.output_path_not_exist'))
      }
    }
    catch (e) {
      return Promise.reject(e)
    }
    finally {
      // @ts-expect-error Garbage collection
      compressor = null
    }
  }
}
