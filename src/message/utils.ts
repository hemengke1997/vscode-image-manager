const timerMap = new Map()
export function debouncePromise<T extends Function>(
  fn: T,
  option: {
    key: string
    wait?: number
  },
) {
  return new Promise<boolean>((resolve, reject) => {
    const { key, wait = 2000 } = option

    let isLeading = false
    if (timerMap.get(key)) {
      clearTimeout(timerMap.get(key))
    } else {
      isLeading = true
      fn()
    }

    const timer = setTimeout(async () => {
      try {
        !isLeading && (await fn())
        resolve(true)
      } catch (error) {
        reject(error)
      } finally {
        timerMap.set(key, null)
      }
    }, wait)
    timerMap.set(key, timer)
  })
}
