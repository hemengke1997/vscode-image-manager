import fs from 'fs-extra'
import mime from 'mime/lite'
import path from 'node:path'

/**
 * 判断是否为 base64
 */
export function isBase64(str: string) {
  return /^data:([a-z]+\/[a-z]+);base64,/.test(str)
}

/**
 * buffer 转 base64
 */
export function toBase64(mimetype: string, buffer: Buffer) {
  return `data:${mimetype};base64,${buffer.toString('base64')}`
}

/**
 * 如果浏览器不支持展示某个格式，则转为 base64
 */
export async function convertToBase64IfBrowserNotSupport(
  input: string,
  sharp: TSharp | undefined,
  inputBuffer?: Buffer,
) {
  let mimetype = mime.getType(input)

  const notSupported = ['tiff', 'tif'].map((t) => mime.getType(t))
  if (mimetype && notSupported.includes(mimetype)) {
    mimetype = mime.getType('png')!
    try {
      const buffer = await sharp!(inputBuffer || input)
        .png()
        .toBuffer()
      return toBase64(mimetype, buffer)
    } catch {
      return input
    }
  }
}

/**
 * 图片转 base64
 */
export async function convertImageToBase64(input: string, sharp: TSharp | undefined) {
  let mimetype = mime.getType(input)

  const base64 = await convertToBase64IfBrowserNotSupport(input, sharp)
  if (base64) {
    return base64
  }

  if (!mimetype) {
    mimetype = `image/${path.extname(input).slice(1)}`
  }
  const buffer = await fs.readFile(input)

  return toBase64(mimetype, buffer)
}
