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
 * 判断浏览器是否支持某个图片格式
 * 如果不支持，则返回一个默认的 mimetype
 */
export function isBrowserSupportImageType(filepath: string) {
  const mimetype = mime.getType(filepath)
  if (!mimetype) {
    return {
      suppprted: false,
      mimetype: `image/${path.extname(filepath).slice(1)}`,
    }
  }
  const notSupported = ['tiff', 'tif'].map((t) => mime.getType(t))
  return {
    suppprted: !notSupported.includes(mimetype),
    mimetype,
  }
}

/**
 * 根据图片buffer 转 base64
 */
export async function bufferTobase64(buffer: Buffer, filepath: string, sharp: TSharp) {
  const { mimetype, suppprted } = isBrowserSupportImageType(filepath)

  if (suppprted) {
    return toBase64(mimetype, buffer)
  }

  buffer = await sharp(buffer).png().toBuffer()
  return toBase64(mimetype, buffer)
}

/**
 * 根据图片path 转 base64
 */
export async function convertImageToBase64(input: string, sharp: TSharp) {
  const { mimetype, suppprted } = isBrowserSupportImageType(input)

  if (suppprted) {
    return toBase64(mimetype, await fs.readFile(input))
  }

  const buffer = await sharp(input).png().toBuffer()
  return toBase64(mimetype, buffer)
}

/**
 * 如果浏览器不支持展示某个格式，则转为 base64
 * 支持，则返回空
 */
export async function convertToBase64IfBrowserNotSupport(input: string, sharp: TSharp) {
  const { suppprted } = isBrowserSupportImageType(input)

  if (suppprted) {
    return null
  }

  return convertImageToBase64(input, sharp)
}
