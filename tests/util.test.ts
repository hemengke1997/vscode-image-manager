import delay from 'delay'
import { mapValues } from 'es-toolkit'
import { flatten } from 'flat'
import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import pkgJson from '~root/package.json'
import { CommanderCache } from '~/core/commander'
import { type ConfigType, DEFAULT_CONFIG } from '~/core/config/common'
import { HookPlugin } from '~/core/hook-plugin'
import { DEFAULT_WORKSPACE_STATE, type WorkspaceStateType } from '~/core/persist/workspace/common'
import {
  cleanVersion,
  generateOutputPath,
  normalizePathNode,
  promiseAllWithFirst,
  resolveDirPath,
  setImmdiateInterval,
} from '~/utils'
import { AbortError, abortPromise, cancelablePromise, TimeoutError } from '~/utils/abort-promise'
import { isBase64, toBase64 } from '~/utils/image-type'
import { intelligentPick } from '~/utils/intelligent-pick'
import { clearTimestamp, formatBytes, pathUtil, triggerOnce } from '~/webview/image-manager/utils'

describe('Util test', () => {
  it('should trigger once', () => {
    const fn = vi.fn()
    const trigger = triggerOnce(fn)
    trigger()
    trigger()
    expect(fn).toBeCalledTimes(1)
  })

  it('should clear timestamp', () => {
    expect(clearTimestamp('https://example.com/1.png?t=123')).toBe('https://example.com/1.png')
    expect(clearTimestamp('https://example.com/1.png')).toBe('https://example.com/1.png')
    expect(clearTimestamp('')).toBe('')
  })

  it('should get absolute path', () => {
    const { getAbsDir } = pathUtil
    expect(getAbsDir('/a/b/c.png')).toBe('/a/b')
    expect(getAbsDir('/a/b')).toBe('/a')
  })

  it('should get dirname', () => {
    const { getDirname } = pathUtil
    expect(getDirname('/a/b')).toBe('b')
    expect(getDirname('/a')).toBe('a')
  })

  it('should get filename', () => {
    const { getFileName } = pathUtil
    expect(getFileName('/a/b/c.png')).toBe('c.png')
    expect(getFileName('/a/b')).toBe('b')
  })

  it('should formatBytes', () => {
    expect(formatBytes(1)).toBe('1 B')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1024 * 1024)).toBe('1 MB')
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB')
    expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1 TB')

    expect(formatBytes(1034, 0)).toBe('1 KB')
    expect(formatBytes(1034, 2)).toBe('1.01 KB')
    expect(formatBytes(1034, 4)).toBe('1.0098 KB')
  })

  it('should pick config intelligently', () => {
    expect(intelligentPick('auto', 'dark', 'auto')).toBe('dark')
    expect(intelligentPick('light', 'auto', 'auto')).toBe('light')
  })

  it('should type check', () => {
    expectTypeOf(DEFAULT_CONFIG).toMatchTypeOf<ConfigType>()
    expectTypeOf(DEFAULT_WORKSPACE_STATE).toMatchTypeOf<WorkspaceStateType>()
  })

  it('should default config match configuration in packagejson', () => {
    const defaultConfig = flatten(
      {
        'image-manager': DEFAULT_CONFIG,
      },
      {
        safe: true,
      },
    )

    const pkgConfig = pkgJson

    const formattedPkgConfig = mapValues(pkgConfig.contributes.configuration.properties, (item) => item.default)
    expect(defaultConfig).toMatchObject(formattedPkgConfig)
  })

  it('should abortPromise throw timeout', async () => {
    const fakePromise = async () => {
      await delay(3000)
    }

    const abortController = new AbortController()
    await expect(
      abortPromise(fakePromise, {
        timeout: 1,
        abortController,
      }),
    ).rejects.toThrowError(TimeoutError)
  })

  it('should abortPromise throw abort', async () => {
    const fakePromise = async () => {
      await delay(3000)
    }

    const abortController = new AbortController()
    abortController.abort()
    await expect(
      abortPromise(fakePromise, {
        timeout: 3000,
        abortController,
      }),
    ).rejects.toThrowError(AbortError)
  })

  it('should abortPromise run successfully', async () => {
    const fakePromise = async () => {
      await delay(60)
      return true
    }

    const abortController = new AbortController()
    const res = await abortPromise(fakePromise, {
      timeout: 3000,
      abortController,
    })

    expect(res).toBeTruthy()
  })

  it('should cancel multiple promises', async () => {
    const fakePromise = async () => {
      await delay(60)
      return true
    }

    const p = () =>
      cancelablePromise.run(fakePromise, {
        key: 'test',
      })

    await expect(Promise.all([p(), p()])).rejects.toThrowError(AbortError)
  })

  it('should not cancel different promises', async () => {
    const fakePromise = async () => {
      await delay(60)
      return true
    }

    const p = (key: string) =>
      cancelablePromise.run(fakePromise, {
        key,
      })

    await expect(Promise.all([p('test1'), p('test2')])).resolves.toBeTruthy()
  })

  it('should be base64', () => {
    expect(isBase64('data:image/png;base64,xxxx')).toBeTruthy()
  })

  it('should convert to base64', () => {
    expect(isBase64(toBase64('image/png', Buffer.from('')))).toBeTruthy()
  })

  it('should normalize path', () => {
    expect(normalizePathNode('a\\b\\c')).toBe('a/b/c')
  })

  it('should generate output path', () => {
    expect(generateOutputPath('a/b/c.png', '@output')).toBe('a/b/c@output.png')
  })

  it('should call interval immediately', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    setImmdiateInterval(fn, 1000)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1500)
    expect(fn).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('should clean version', () => {
    expect(cleanVersion('v1.0.0')).toBe('1.0.0')
  })

  it('should resolve dir path', () => {
    expect(resolveDirPath('/a/b/c.png', '/a')).toBe('b')
  })

  it('should promise all with first', async () => {
    const p1 = async () => {
      await delay(100)
      return 1
    }
    const p2 = async () => {
      await delay(10)
      return 2
    }
    const p3 = async () => {
      await delay(1)
      return 3
    }

    await expect(promiseAllWithFirst([p1, p2, p3])).resolves.toEqual([1, 2, 3])
  })
})

describe('Hook Plugin', () => {
  class TestPlugin extends HookPlugin<{
    before: () => Promise<void>
    after: () => Promise<void>
  }> {
    async run() {
      await this.hooks.callHook('before')
      console.log('run')
      await this.hooks.callHook('after')
    }
  }

  let testPlugin: TestPlugin
  beforeEach(() => {
    testPlugin = new TestPlugin({
      plugins: [
        {
          name: 'test',
          hooks: {
            async before() {
              console.log('before')
            },
            async after() {
              console.log('after')
            },
          },
        },
      ],
    })
  })

  it('should log by order', async () => {
    const log = vi.spyOn(console, 'log')
    await testPlugin.run()

    expect(log.mock.calls).toEqual([['before'], ['run'], ['after']])
    log.mockRestore()
  })

  it('should pluginMap correctly', () => {
    expect(testPlugin.pluginMap.size).toBe(1)
    testPlugin.removePlugins('test')
    expect(testPlugin.pluginMap.size).toBe(0)
  })

  it('should add plugins', () => {
    testPlugin.applyPlugins([
      {
        name: 'test2',
        hooks: {
          async before() {
            console.log('before')
          },
          async after() {
            console.log('after')
          },
        },
      },
    ])
    expect(testPlugin.pluginMap.size).toBe(2)
  })

  it('should call hook by order', async () => {
    const log = vi.spyOn(console, 'log')

    testPlugin.applyPlugins([
      {
        name: 'test2',
        hooks: {
          async before() {
            console.log('before')
          },
          async after() {
            console.log('after')
          },
        },
      },
    ])

    await testPlugin.run()

    expect(log.mock.calls).toEqual([['before'], ['before'], ['run'], ['after'], ['after']])
    log.mockRestore()
  })
})

describe('Cache Commander', () => {
  const commandCache = new CommanderCache()
  beforeEach(() => {
    commandCache.clear()
  })

  it('should add to cache', () => {
    commandCache.add({
      id: 'test',
      undo: async () => {},
      details: {},
    })

    expect(commandCache.cache.size).toBe(1)
  })

  it('should remove from cache', () => {
    commandCache.add({
      id: 'test',
      undo: async () => {},
      details: {},
    })

    commandCache.remove('test')
    expect(commandCache.cache.size).toBe(0)
  })

  it('should clear cache', () => {
    commandCache.add({
      id: 'test',
      undo: async () => {},
      details: {},
    })

    commandCache.clear()
    expect(commandCache.cache.size).toBe(0)
  })

  it('should execute undo', async () => {
    const undo = vi.fn()
    commandCache.add({
      id: 'test',
      undo,
      details: {},
    })

    await commandCache.executeUndo('test')
    expect(undo).toBeCalledTimes(1)
    expect(commandCache.cache.size).toBe(0)
  })

  it('should get cache', () => {
    commandCache.add({
      id: 'test',
      undo: async () => {},
      details: {},
    })

    expect(commandCache.get('test')).toBeTruthy()
  })
})
