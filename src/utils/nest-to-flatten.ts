import { isObject } from '@minko-fe/lodash-pro'

export function nestToFlatten<T = any>(messages: Record<string, T>) {
  const result: Record<string, T> = {}
  for (const key in messages) {
    const value = messages[key]
    if (isObject(value)) {
      const nested = nestToFlatten(value)
      for (const nestedKey in nested) {
        result[`${key}.${nestedKey}`] = nested[nestedKey]
      }
    } else {
      result[key] = value
    }
  }
  return result
}
