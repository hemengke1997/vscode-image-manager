/**
 * 从两个值中智能选择一个值
 * @param first
 * @param second
 * @param exclude 被排除的值
 */
export function intelligentPick<T>(first: T, second: T, exclude: T) {
  return first === exclude ? second : first
}
