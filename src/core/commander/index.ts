import logger from '~/utils/logger'

export class Commander {
  constructor(
    public id: string,
    public undo: () => Promise<void>,
  ) {}

  addToCache(): void {
    commandCache.add(this)
  }
}

class Cache {
  private cache: Map<string, Commander>

  constructor() {
    this.cache = new Map<string, Commander>()
  }

  /**
   * 添加Commander到缓存
   */
  add(commander: Commander): void {
    this.cache.set(commander.id, commander)
    logger.debug('add commander to cache:', commander.id)
  }

  /**
   * 从缓存中删除Commander
   */
  remove(id: string): void {
    if (this.cache.has(id)) {
      this.cache.delete(id)
      logger.debug(`Commander with id ${id} removed from cache`)
    }
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
    this.cache = new Map<string, Commander>()
    logger.debug('Commander cache cleared')
  }

  /**
   * 执行Commander的undo方法，并在成功后删除缓存
   */
  async executeUndo(id: string): Promise<void> {
    const commander = this.cache.get(id)
    if (commander) {
      try {
        await commander.undo()
      } finally {
        this.remove(id)
      }
    } else {
      logger.warn(`Commander with id ${id} not found in cache`)
    }
  }
}

export const commandCache = new Cache()
