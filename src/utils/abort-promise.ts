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

export async function abortPromise<T = any>(
  promiseFn: () => Promise<T>,
  options: {
    timeout?: number
    abortController: AbortController
    mock?: boolean
  },
) {
  const { timeout = Infinity, abortController, mock } = options

  try {
    const res = await pTimeout<T>(mock ? delay(timeout) : promiseFn(), {
      milliseconds: timeout,
      signal: abortController.signal,
    })
    return res
  } catch (e) {
    const message = e instanceof Error ? e.message : ''
    if (message.includes('timed out')) {
      throw new TimeoutError(message)
    } else if (message.includes('aborted')) {
      throw new AbortError(message)
    }
    throw e
  }
}

class CancelablePromise {
  abortPromiseMap = new Map<string, AbortController>()
  run = async <T = any>(
    promiseFn: () => Promise<T>,
    options: {
      key: string
      timeout?: number
      mock?: boolean
    },
  ) => {
    const { key, timeout, mock } = options

    if (this.abortPromiseMap.has(key)) {
      this.abortPromiseMap.get(key)?.abort()
    }

    const controller = new AbortController()
    this.abortPromiseMap.set(key, controller)

    return abortPromise(promiseFn, {
      timeout,
      abortController: controller,
      mock,
    }).finally(() => {
      this.abortPromiseMap.delete(key)
    })
  }
}

const cancelablePromise = new CancelablePromise()

export { cancelablePromise }
