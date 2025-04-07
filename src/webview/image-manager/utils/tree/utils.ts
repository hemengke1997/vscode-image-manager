/**
 * 格式化路径，把路径中的多余斜杠和结尾斜杠去掉
 */
export function normalizePathClient<T extends string>(path: T | null | undefined): T {
  if (!path) return path as T
  return path.replace(/\/+/g, '/').replace(/\/$/, '') as T
}
