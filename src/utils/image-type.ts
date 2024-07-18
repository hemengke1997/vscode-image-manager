import fs from 'fs-extra'
import mime from 'mime/lite'
import path from 'node:path'
import { Global } from '~/core'

export function isPng(filePath: string) {
  return isSomeImageType(filePath, ['png'])
}

export function isJpg(filePath: string) {
  return isSomeImageType(filePath, ['jpg', 'jpeg'])
}

export function isTiff(filePath: string) {
  return isSomeImageType(filePath, ['tiff', 'tif'])
}

function isSomeImageType(filePath: string, type: string[]) {
  const ext = path.extname(filePath).toLowerCase()
  if (!ext) return type.some((t) => t === filePath)
  return type.some((t) => ext === `.${t}`)
}

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
export async function convertToBase64IfBrowserNotSupport(input: string) {
  let mimetype = mime.getType(input)
  if (mimetype && ['image/tiff'].includes(mimetype)) {
    mimetype = 'image/png'
    const sharp = Global.sharp(input)
    sharp.png()
    const buffer = await sharp.toBuffer()
    return toBase64(mimetype, buffer)
  }
}

/**
 * 图片转 base64
 */
export async function convertImageToBase64(input: string) {
  let mimetype = mime.getType(input)

  const base64 = await convertToBase64IfBrowserNotSupport(input)
  if (base64) {
    return base64
  }

  if (!mimetype) {
    mimetype = `image/${path.extname(input).slice(1)}`
  }
  const buffer = await fs.readFile(input)

  return toBase64(mimetype, buffer)
}
