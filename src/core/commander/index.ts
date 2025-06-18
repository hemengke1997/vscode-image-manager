import type { Buffer } from 'node:buffer'
import logger from '~/utils/logger'

class Commander<T> {
  details: T = {} as T
  constructor(
    public id: string,
    public undo: () => Promise<void>,
  ) {}
}

export class CommanderCache<T> {
  cache: Map<string, Commander<T>>

  constructor() {
    this.cache = new Map<string, Commander<T>>()
  }

  /**
   * 获取Commander缓存
   */
  get = (id: string) => {
    return this.cache.get(id)
  }

  /**
   * 添加Commander到缓存
   */
  add = (commander: Commander<T>) => {
    this.cache.set(commander.id, commander)
    logger.debug('add commander to cache:', commander.id)
    return this
  }

  /**
   * 从缓存中删除Commander
   */
  remove = (id: string) => {
    if (this.cache.has(id)) {
      this.cache.delete(id)
      logger.debug(`Commander with id ${id} removed from cache`)
    }
    return this
  }

  /**
   * 清空缓存
   */
  clear = () => {
    this.cache.clear()
    this.cache = new Map<string, Commander<T>>()
    logger.debug('Commander cache cleared')
  }

  /**
   * 执行Commander的undo方法，并在成功后删除缓存
   */
  executeUndo = async (id: string): Promise<void> => {
    const commander = this.cache.get(id)
    if (commander) {
      try {
        await commander.undo()
      }
      finally {
        this.remove(id)
      }
    }
    else {
      logger.warn(`Commander with id ${id} not found in cache`)
    }
  }
}

export const commandCache = new CommanderCache<{
  inputBuffer: Buffer | null
  inputPath: string
}>()
