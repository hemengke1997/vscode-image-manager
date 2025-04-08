import fs from 'fs-extra'
import path from 'node:path'
import { slashPath } from '..'

/**
 * 生成输入路径
 * @param input 输入路径
 * @param suffix 后缀
 * @returns
 */
export function generateOutputPath(input: string, suffix: string) {
  const { name, ext, dir } = path.parse(input)
  const filename = `${name}${suffix}`
  const outputPath = `${dir}/${filename}${ext}`

  const fileExists = fs.existsSync(outputPath)

  if (fileExists) {
    return generateOutputPath(outputPath, suffix)
  }
  return outputPath
}

/**
 * 文件路径是否可写
 * @param path
 * @returns
 */
export function isFsWritable(path: string) {
  try {
    fs.accessSync(path, fs.constants.W_OK)
    return true
  } catch {
    return false
  }
}

/**
 * 解析路径相对于当前工作目录的路径
 * @param 文件路径
 * @param cwd 当前工作目录
 * @returns
 */
export function resolveDirPath(imagePath: string, cwd: string, isDirectory = false) {
  const target = isDirectory ? imagePath : path.dirname(imagePath)
  if (cwd === target) return ''
  return slashPath(path.relative(cwd, target))
}
