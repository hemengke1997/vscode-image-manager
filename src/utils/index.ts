import fs from 'fs-extra'
import path from 'node:path'
import slash from 'slash'

export function normalizePath(id: string): string {
  return slash(id)
}

export function isPng(filePath: string) {
  return isSomeImageType(filePath, ['png'])
}

export function isJpg(filePath: string) {
  return isSomeImageType(filePath, ['jpg', 'jpeg'])
}

function isSomeImageType(filePath: string, type: string[]) {
  const ext = path.extname(filePath).toLowerCase()
  if (!ext) return type.some((t) => t === filePath)
  return type.some((t) => ext === `.${t}`)
}

export function generateOutputPath(filePath: string, suffix: string) {
  const { name, ext, dir } = path.parse(filePath)
  const filename = `${name}${suffix}`
  const outputPath = `${dir}/${filename}${ext}`

  const fileExists = fs.existsSync(outputPath)

  if (fileExists) {
    return generateOutputPath(outputPath, suffix)
  }
  return outputPath
}

export function isValidHttpsUrl(url: string) {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'https:'
  } catch (e) {
    return false
  }
}
