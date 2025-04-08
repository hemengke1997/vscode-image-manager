/**
 * 格式化展示路径
 */
export function formatPath<T extends string>(path: T | null | undefined): T {
  if (!path) return path as T
  return path
    .replace(/\/+/g, '/')
    .replace(/^\/(?=.+)/, '')
    .replace(/(?<=.+)\/$/, '') as T
}
