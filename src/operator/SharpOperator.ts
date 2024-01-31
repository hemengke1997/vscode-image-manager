import type SharpNS from 'sharp'
import fs from 'fs-extra'
import { type Hookable, createHooks } from '@/fork/hookable'
import { Log } from '@/utils/Log'

type TSharp = typeof SharpNS
type HookResult<T = void> = Promise<T> | T

const PluginIndicator = '__operator_plugin'

interface PluginMeta {
  name: string
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
  'on:configuration': () => HookResult<SharpNS.SharpOptions>
  'before:run': (sharp: SharpNS.Sharp) => HookResult<SharpNS.Sharp>
  'after:run': (res: { outputPath: string }) => HookResult
  'on:finish': (res: { inputSize: number; outputSize: number; outputPath: string }) => HookResult
  'on:genOutputPath': (inputPath: string) => HookResult<string>
}

interface IContext {
  outputPath: string | undefined
  sharp: typeof SharpNS | undefined
}

class Context implements IContext {
  outputPath: string | undefined
  sharp: typeof SharpNS | undefined

  constructor(option: Partial<IContext>) {
    this.outputPath = option.outputPath
    this.sharp = option.sharp
  }
}

const SHARP_LIB_RESOLVE_PATH = './lib/install/sharp.cjs'

export class SharpOperator {
  ctx: IContext
  private _hooks: Hookable<RuntimeHooks>
  private _hooksMap: Map<string, Partial<RuntimeHooks>> = new Map()

  constructor(option?: { plugins: ObjectPlugin[] }) {
    const { plugins } = option || {}
    this._hooks = createHooks<RuntimeHooks>()

    try {
      const sharp = this._loadSharp()

      this.ctx = new Context({ sharp })
      if (plugins?.length) {
        this._applyPlugins(plugins)
      }
    } catch (e) {
      this.ctx = new Context({})
    }
  }

  use(plugins: ObjectPlugin[]) {
    this._applyPlugins(plugins)
    return this
  }

  remove(configHooks: Parameters<Hookable['removeHooks']>[0]) {
    this._hooks.removeHooks(configHooks)
    return this
  }

  private async _applyPlugin(plugin: ObjectPlugin) {
    if (this._hooksMap.has(plugin.name)) {
      this.remove(this._hooksMap.get(plugin.name)!)
      this._hooksMap.delete(plugin.name)
    }
    if (plugin.hooks) {
      this._hooks.addHooks(plugin.hooks)
      this._hooksMap.set(plugin.name, plugin.hooks)
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
    if (!this.ctx.sharp) return Promise.resolve()

    Log.info(`${filePath} -run`)

    this.ctx.sharp.cache({
      files: 0,
      items: 200,
      memory: 200,
    })

    let sharpIntance = this.ctx.sharp(filePath, {
      animated: true,
      limitInputPixels: false,
      ...(await this._hooks.callHook('on:configuration')),
    })

    sharpIntance = await this._hooks.callHook('before:run', sharpIntance)

    return new Promise((resolve, reject) => {
      const inputSize = fs.statSync(filePath).size

      sharpIntance
        .toBuffer()
        .then(async (buffer) => {
          const outputPath = await this.genOutputPath(filePath)

          try {
            await this._hooks.callHook('after:run', { outputPath })
            const fileWritableStream = fs.createWriteStream(outputPath)

            fileWritableStream.on('finish', () => {
              const outputSize = fs.statSync(outputPath).size

              const result = {
                inputSize,
                outputSize,
                outputPath,
              }

              this._hooks.callHook('on:finish', result)
              resolve(result)
            })

            fileWritableStream.write(buffer)
            fileWritableStream.end()
          } catch (e) {
            reject(e)
          }
        })
        .catch((e) => {
          reject(e)
        })
    })
  }

  async genOutputPath(filePath: string) {
    const outputPath = (await this._hooks.callHook('on:genOutputPath', filePath)) || filePath
    this.ctx.outputPath = outputPath
    return outputPath
  }

  public detectUsable() {
    try {
      require.resolve(SHARP_LIB_RESOLVE_PATH)
      delete require.cache[require.resolve(SHARP_LIB_RESOLVE_PATH)]
      return true
    } catch {
      delete require.cache[require.resolve(SHARP_LIB_RESOLVE_PATH)]
      return false
    }
  }

  private _loadSharp(): TSharp {
    return require(SHARP_LIB_RESOLVE_PATH).default
  }
}
