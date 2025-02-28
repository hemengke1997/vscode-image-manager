import debounce from 'debounce'
import { round, sortBy, uniqBy } from 'lodash-es'

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) {
    return '0 B'
  }
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${round(bytes / k ** i, dm)} ${sizes[i]}`
}

export function bytesToUnit(bytes: number | undefined, unit: 'KB' | 'MB'): number {
  if (!bytes) return 0
  const sizes = ['KB', 'MB']
  const i = sizes.indexOf(unit)
  return round(bytes / 1024 ** (i + 1), 2)
}

/**
 * 路径相关工具方法
 */
export const pathUtil = {
  /**
   * 从路径中获取文件目录
   * @param filePath /a/b/c.png
   * @returns /a/b
   */
  getAbsDir: (filePath: string) => {
    return filePath.substring(0, filePath.lastIndexOf('/'))
  },

  /**
   * 获取路径的目录名
   * @param dirPath /a/b
   * @returns b
   */
  getDirname: (dirPath: string) => {
    return dirPath.split('/').pop()!
  },

  /**
   * 从路径获取文件名
   * @param filePath /a/b/c.png
   * @returns c.png
   */
  getFileName(filePath: string) {
    return filePath.split('/').pop()!
  },
}

/**
 * 将一定规则去重、排序后的图片列表转为其他列表
 * @param images 图片列表
 * @param key 去重、排序的规则key
 * @param convert 转化规则
 * @returns 转化后的列表
 */
export function uniqSortByThenMap<T>(images: ImageType[], key: keyof ImageType, convert: (image: ImageType) => T): T[] {
  if (!images.length) return []

  return sortBy(uniqBy(images, key), key).map((item) => convert(item))
}

/**
 * 从图片列表中找出同工作区的图片
 * @param image
 * @param imageList
 * @returns
 */
export function findSameWorkspaceImages(image: ImageType, imageList: ImageType[]) {
  return imageList.filter((item) => image.workspaceFolder === item.workspaceFolder)
}

/**
 * 事件只执行一次
 */
export function triggerOnce<T extends (...args: any[]) => any>(fn: T) {
  return debounce(fn, Number.MAX_SAFE_INTEGER, { immediate: true })
}

/**
 * 清除路径中的时间戳
 */
export function clearTimestamp(path: string | undefined) {
  if (!path) return ''
  const index = path.lastIndexOf('?')
  if (index !== -1) return path.slice(0, index)
  return path
}
