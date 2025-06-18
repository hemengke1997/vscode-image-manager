import { slashPath } from '~/utils'

/**
 * 格式化展示路径
 */
export function formatPath<T extends string>(path: T | null | undefined): T {
  if (!path)
    return path as T

  // 在slashPath的基础上，把开头和结尾的/去掉
  return slashPath(path)
    .replace(/^\/(?=.)/, '')
    .replace(/(?<=.)\/$/, '') as T
}
