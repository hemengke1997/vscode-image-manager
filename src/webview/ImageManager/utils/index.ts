import { isObject, round, uniq } from '@minko-fe/lodash-pro'
import { type ImageType } from '..'

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

export function flattenKeys<T>(list: T[], resolveValue: (current: T) => string[]) {
  return list.reduce(
    (acc, current) => {
      const values = resolveValue(current)
      return acc.flatMap((item) => values.map((value) => (item ? `${item}/${value}` : value)))
    },
    [''],
  )
}

export function shouldShowImage(image: ImageType) {
  if (isObject(image.visible) && Object.keys(image.visible).some((k) => image.visible?.[k] === false)) {
    return false
  }
  return true
}

export function filterVisibleImages(images: ImageType[], filterValue: (image: ImageType) => string) {
  return uniq(images.map((item) => filterValue(item))).sort()
}
