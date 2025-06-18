import delay from 'delay'
import pTimeout from 'p-timeout'

export class TimeoutError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

export class AbortError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'AbortError'
  }
}

export async function abortPromise<P = any, T = any>(
  promiseFn: (params?: P) => Promise<T>,
  options: {
    timeout?: number
    abortController: AbortController
    mock?: boolean
    params?: P
  },
) {
  const { timeout = Infinity, abortController, mock, params } = options

  try {
    const res = await pTimeout<T>(mock ? delay(timeout) : promiseFn(params), {
      milliseconds: timeout,
      signal: abortController.signal,
    })
    return res
  }
  catch (e) {
    const message = e instanceof Error ? e.message : ''
    if (message.includes('timed out')) {
      throw new TimeoutError(message)
    }
    else if (message.includes('aborted')) {
      throw new AbortError(message)
    }
    throw e
  }
}

class CancelablePromise {
  abortPromiseMap = new Map<string, AbortController>()
  run = async <P = any, T = any>(
    promiseFn: (params?: P) => Promise<T>, // 修改为支持接受参数
    options: {
      key: string
      timeout?: number
      mock?: boolean
      params?: P
    },
  ) => {
    const { key, timeout, mock, params } = options

    if (this.abortPromiseMap.has(key)) {
      this.abortPromiseMap.get(key)?.abort()
    }

    const controller = new AbortController()
    this.abortPromiseMap.set(key, controller)

    return abortPromise(promiseFn, {
      timeout,
      abortController: controller,
      mock,
      params, // 将参数传递给 abortPromise
    }).finally(() => {
      this.abortPromiseMap.delete(key)
    })
  }
}

const cancelablePromise = new CancelablePromise()

export { cancelablePromise }
