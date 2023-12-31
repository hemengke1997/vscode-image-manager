import { isObject } from '@minko-fe/lodash-pro'
import { type ImageType } from '..'

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) {
    return '0 B'
  }
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

export function bytesToKb(bytes: number): number {
  return bytes / 1024
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
