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
    timeout: number
    abortController: AbortController
    mock?: boolean
  },
) {
  const { timeout, abortController, mock } = options

  try {
    const res = await pTimeout<T>(mock ? delay(timeout * 100) : promise(), {
      milliseconds: timeout,
      signal: abortController.signal,
    })
    return res
  } catch (e) {
    const message = e instanceof Error ? e.message : ''
    if (message.includes('timed out')) {
      throw new TimeoutError()
    } else if (message.includes('aborted')) {
      throw new AbortError()
    }
    throw e
  }
}
