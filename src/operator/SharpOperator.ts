import type SharpNS from 'sharp'
import fs from 'fs-extra'
import { Hookable } from '@/lib/hookable'

type TSharp = typeof SharpNS
type HookResult<T = void> = Promise<T> | T

const PluginIndicator = '__operator_plugin'

export interface ResolvedPluginMeta {
  name?: string
  parallel?: boolean
}

interface PluginMeta {
  name?: string
  enforce?: 'pre' | 'default' | 'post'
}

interface ObjectPlugin extends PluginMeta {
  hooks: Partial<RuntimeHooks>
  /**
   * Execute plugin in parallel with other parallel plugins.
   * @default false
   */
  parallel?: boolean
}

export function defineOperatorPlugin(plugin: ObjectPlugin): ObjectPlugin {
  return Object.assign(plugin, { [PluginIndicator]: true } as const)
}

interface RuntimeHooks {
  'on:input': (sharp: SharpNS.Sharp) => HookResult<SharpNS.Sharp>
  'on:output': (sharp: SharpNS.Sharp) => HookResult
  'on:finish': (res: { inputSize: number; outputSize: number; outputPath: string }) => HookResult
  'on:genOutputPath': (inputPath: string) => HookResult<string>
}

export class SharpOperator extends Hookable<RuntimeHooks> {
  sharp: TSharp | null

  constructor(option?: { plugins: ObjectPlugin[] }) {
    const { plugins } = option || {}
    super()
    try {
      this.detectUsable()
      this.sharp = this._loadSharp()

      if (plugins?.length) {
        this._applyPlugins(plugins)
      }
    } catch (e) {
      this.sharp = null
    }
  }

  use(plugins: ObjectPlugin[]) {
    this._applyPlugins(plugins)
    return this
  }

  remove(configHooks: Parameters<Hookable['removeHooks']>[0]) {
    this.removeHooks(configHooks)
    return this
  }

  private async _applyPlugin(plugin: ObjectPlugin) {
    if (plugin.hooks) {
      this.addHooks(plugin.hooks)
    }
  }

  private _sortPlugins(plugins: ObjectPlugin[]) {
    const prePlugins: ObjectPlugin[] = []
    const postPlugins: ObjectPlugin[] = []
    const normalPlugins: ObjectPlugin[] = []

    plugins.forEach((plugin) => {
      if (plugin.enforce === 'pre') {
        prePlugins.push(plugin)
      } else if (plugin.enforce === 'post') {
        postPlugins.push(plugin)
      } else {
        normalPlugins.push(plugin)
      }
    })

    return [...prePlugins, ...normalPlugins, ...postPlugins]
  }

  private async _applyPlugins(plugins: ObjectPlugin[]) {
    const parallels: Promise<any>[] = []
    const errors: Error[] = []

    plugins = this._sortPlugins(plugins)

    for (const plugin of plugins) {
      const promise = this._applyPlugin(plugin)
      if (plugin.parallel) {
        parallels.push(promise.catch((e) => errors.push(e)))
      } else {
        await promise
      }
    }
    await Promise.all(parallels)
    if (errors.length) {
      throw errors[0]
    }
  }

  async run(filePath: string): Promise<{
    inputSize: number
    outputSize: number
    outputPath: string
  } | void> {
    if (!this.sharp) return Promise.resolve()
    const inputSize = fs.statSync(filePath).size
    let sharpIntance = this.sharp(filePath)
    sharpIntance = await this.callHook('on:input', sharpIntance)
    return new Promise((resolve, reject) => {
      sharpIntance.toBuffer().then(async (buffer) => {
        const outputPath = await this.genOutputPath(filePath)
        await this.callHook('on:output', sharpIntance)
        try {
          const fileWritableStream = fs.createWriteStream(outputPath)

          fileWritableStream.on('finish', () => {
            const outputSize = fs.statSync(outputPath).size

            const result = {
              inputSize,
              outputSize,
              outputPath,
            }

            this.callHook('on:finish', result)
            resolve(result)
          })

          fileWritableStream.write(buffer)
          fileWritableStream.end()
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  async genOutputPath(filePath: string) {
    return (await this.callHook('on:genOutputPath', filePath)) || filePath
  }

  public detectUsable() {
    try {
      require.resolve('sharp')
      delete require.cache[require.resolve('sharp')]
      return true
    } catch {
      delete require.cache[require.resolve('sharp')]
      return false
    }
  }

  private _loadSharp(): TSharp {
    const _sharp = require('sharp')
    return _sharp
  }
}
