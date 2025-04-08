import slash from 'slash'

/**
 * 从两个值中智能选择一个值
 * @param first
 * @param second
 * @param exclude 被排除的值
 *
 * @note webview 和 core 中都用到了这个方法，所以单独提取出来
 */
export function intelligentPick<T>(first: T, second: T, exclude: T) {
  return first === exclude ? second : first
}

/**
 * 格式化文件路径
 */
export function slashPath(p: string) {
  return slash(p).replace(/\/+/g, '/')
}

export function ensureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
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
 * 首次立即执行定时器
 * @returns
 */
export function setImmdiateInterval(callback: () => void, interval: number) {
  callback()
  return setInterval(callback, interval)
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
