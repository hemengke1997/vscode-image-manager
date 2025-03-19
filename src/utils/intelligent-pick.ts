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
