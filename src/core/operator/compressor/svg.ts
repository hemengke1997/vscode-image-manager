import type { Buffer } from 'node:buffer'
import type { CompressionOptions } from './type'
import type { ImageManagerPanel } from '~/webview/panel'
import fs from 'fs-extra'
import { i18n } from '~/i18n'
import { CmdToVscode } from '~/message/cmd'
import { VscodeMessageFactory } from '~/message/message-factory'
import { SkipError } from '../operator'
import { Svgo } from '../svgo'
import { Compressor } from './compressor'

export class SvgCompressor extends Compressor {
  public extensions = ['svg']
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

  async core(filePath: string) {
    return new Promise<{
      outputPath: string
      inputSize: number
      outputSize: number
      inputBuffer: Buffer
    }>(async (resolve, reject) => {
      try {
        const svgBuffer = await fs.readFile(filePath)
        const svgString = svgBuffer.toString('utf-8')
        const outputPath = this.getOutputPath(filePath, {
          ext: 'svg',
          size: 1,
          fileSuffix: this.option.fileSuffix,
        })

        // 如果压缩后的svg和原来的一样
        // 说明已经压缩过了
        // 直接跳过
        if (
          this.option.skipCompressed
          && Svgo.isCompressed(svgString, { compressedAttribute: this.option.svg.compressedAttribute })
        ) {
          return reject(new SkipError())
        }

        if (!outputPath) {
          return reject(i18n.t('core.output_path_not_exist'))
        }

        const inputSize = await this.getFileSize(filePath)

        const result = {
          inputBuffer: svgBuffer,
          outputPath,
          inputSize,
        }

        fs.ensureFileSync(outputPath)

        fs.access(outputPath, fs.constants.W_OK, async (err) => {
          try {
            if (err) {
              // 删除文件，重新创建svg文件
              await VscodeMessageFactory[CmdToVscode.delete_file]({ filePaths: [filePath] })
              fs.ensureFileSync(outputPath)
            }
            const minifiedSvg = await Svgo.minify(svgString, this.option.svg)

            await fs.writeFile(filePath, minifiedSvg, 'utf-8')

            const outputSize = await this.getFileSize(outputPath)
            resolve({
              ...result,
              outputSize,
            })
          }
          catch (e) {
            reject(e)
          }
        })
      }
      catch (e: any) {
        reject(e)
      }
    })
  }
}
