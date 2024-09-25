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
  promise: () => Promise<T>,
  options: {
    timeout?: number
    abortController: AbortController
    mock?: boolean
  },
) {
  const { timeout = Infinity, abortController, mock } = options

  try {
    const res = await pTimeout<T>(mock ? delay(timeout) : promise(), {
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

const abortPromiseMap = new Map<string, AbortController>()
export async function controlledAbortPromise<T = any>(
  promise: () => Promise<T>,
  options: {
    key: string
    timeout?: number
    mock?: boolean
  },
) {
  const { key, timeout, mock } = options

  if (abortPromiseMap.has(key)) {
    abortPromiseMap.get(key)?.abort()
  }

  const controller = new AbortController()
  abortPromiseMap.set(key, controller)

  return abortPromise(promise, {
    timeout,
    abortController: controller,
    mock,
  }).finally(() => {
    abortPromiseMap.delete(key)
  })
}
