import { round, sortBy, uniqBy } from '@minko-fe/lodash-pro'

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

export function bytesToKb(bytes: number | undefined): number {
  if (!bytes) return 0
  return round(bytes / 1024, 2)
}

/**
 * 从路径中获取文件名称
 * @param filePath
 * @returns
 */
export function getFilenameFromPath(filePath: string) {
  return filePath.split('/').pop()
}

/**
 * 从路径中获取文件目录
 * @param filePath
 * @returns
 */
export function getDirFromPath(filePath: string) {
  return filePath.substring(0, filePath.lastIndexOf('/'))
}

/**
 * 获取文件的basename
 * @param filename example.png
 * @returns example
 */
export function getFilebasename(filename: string) {
  return filename.split('.').slice(0, -1).join('.')
}

/**
 * 获取路径的目录名
 */
export function getDirnameFromPath(dirPath: string) {
  return dirPath.split('/').pop()!
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
