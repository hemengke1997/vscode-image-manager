import fs from 'fs-extra'
import path from 'node:path'
import slash from 'slash'

/**
 * 格式化路径
 */
export function normalizePath(id: string): string {
  return slash(id)
}

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
 * 首次立即执行定时器
 * @returns
 */
export function setImmdiateInterval(callback: () => void, interval: number) {
  callback()
  return setInterval(callback, interval)
}

/**
 * 把版本号前面的非数字字符去掉
 * @param version
 * @returns
 */
export function cleanVersion(version: string) {
  return version.replace(/^[^0-9]+/, '')
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
 * 解析图片相对于当前工作目录的路径
 * @param imagePath 图片路径
 * @param cwd 当前工作目录
 * @returns
 */
export function resolveDirPath(imagePath: string, cwd: string) {
  if (cwd === path.dirname(imagePath)) return ''
  return normalizePath(path.relative(cwd, path.dirname(imagePath)))
}

export function ensureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

/**
 * 先执行第一个promise，再并发执行剩余的promise
 */
export async function promiseAllWithFirst<T>(promises: (() => Promise<T>)[]): Promise<T[]> {
  if (promises.length === 0) {
    return []
  }

  const firstResult = await promises[0]()

  const remainingPromises = promises.slice(1).map((p) => p())
  const remainingResults = await Promise.all(remainingPromises)

  return [firstResult, ...remainingResults]
}
