import fs from 'fs-extra'
import { type SharpNS } from '~/@types/global'
import { type Hookable, createHooks } from '~/fork/hookable'
import { Log } from '~/utils/Log'
import { Global } from '..'

type HookResult<T = void> = Promise<T> | T

const PluginIndicator = '__operator_plugin'

interface PluginMeta {
  name: string
  enforce?: 'pre' | 'default' | 'post'
}

interface ObjectPlugin<RuntimeCtx extends InternalRuntimeCtx = InternalRuntimeCtx> extends PluginMeta {
  hooks: Partial<RuntimeHooks<RuntimeCtx>>
  /**
   * Execute plugin in parallel with other parallel plugins.
   * @default false
   */
  parallel?: boolean
}

export function defineOperatorPlugin(plugin: ObjectPlugin): ObjectPlugin {
  return Object.assign(plugin, { [PluginIndicator]: true } as const)
}

interface RuntimeHooks<RuntimeCtx extends InternalRuntimeCtx = InternalRuntimeCtx> {
  'on:configuration': (ctx: Context<RuntimeCtx>) => HookResult<SharpNS.SharpOptions | undefined>
  'before:run': (ctx: Context<RuntimeCtx>) => HookResult<SharpNS.Sharp>
  'after:run': (ctx: Context<RuntimeCtx>, res: { outputPath: string }) => HookResult
  'on:finish': (
    ctx: Context<RuntimeCtx>,
    res: { inputSize: number; outputSize: number; outputPath: string },
  ) => HookResult
  'on:genOutputPath': (ctx: Context<RuntimeCtx>, res: { inputPath: string }) => HookResult<string>
}

class Context<RuntimeCtx extends InternalRuntimeCtx = InternalRuntimeCtx> {
  sharp: SharpNS.Sharp
  sharpFactory: TSharp
  runtime: RuntimeCtx

  constructor() {
    this.sharp = {} as SharpNS.Sharp
    this.sharpFactory = {} as TSharp
    this.runtime = {} as RuntimeCtx
    return this
  }
}

type InternalRuntimeCtx = {
  filePath: string
} & Record<string, any>

export class SharpOperator<RuntimeCtx extends InternalRuntimeCtx> {
  ctx: Context<RuntimeCtx>
  private _hooks: Hookable<RuntimeHooks<RuntimeCtx>>
  private _hooksMap: Map<string, Partial<RuntimeHooks<RuntimeCtx>>> = new Map()

  constructor(option?: { plugins: ObjectPlugin<RuntimeCtx>[] }) {
    const { plugins } = option || {}
    this._hooks = createHooks<RuntimeHooks<RuntimeCtx>>()
    this.ctx = new Context<RuntimeCtx>()
    try {
      const sharp = Global.sharp
      this.ctx.sharpFactory = sharp

      if (plugins?.length) {
        this._applyPlugins(plugins as ObjectPlugin[])
      }
    } catch (e) {}
  }

  use(plugins: ObjectPlugin[]) {
    this._applyPlugins(plugins)
    return this
  }

  remove(configHooks: Parameters<(typeof this._hooks)['removeHooks']>[0]) {
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

  async run(runtime: RuntimeCtx): Promise<{
    inputSize: number
    outputSize: number
    outputPath: string
  } | void> {
    if (!this.ctx.sharp) return Promise.resolve()
    this.ctx.runtime = runtime

    const filePath = runtime.filePath
    Log.info(`${filePath} -run`)

    this.ctx.sharpFactory.cache({
      files: 0,
      items: 200,
      memory: 200,
    })

    this.ctx.sharp = this.ctx.sharpFactory(filePath, {
      ...((await this._hooks.callHook('on:configuration', this.ctx)) || {}),
    })

    await this._hooks.callHook('before:run', this.ctx)

    return new Promise((resolve, reject) => {
      const inputSize = fs.statSync(filePath).size

      this.ctx.sharp
        ?.toBuffer()
        .then(async (buffer) => {
          const outputPath = await this.genOutputPath(filePath)

          try {
            await this._hooks.callHook('after:run', this.ctx, { outputPath })
            const fileWritableStream = fs.createWriteStream(outputPath)

            fileWritableStream.on('finish', async () => {
              const outputSize = fs.statSync(outputPath).size

              const result = {
                inputSize,
                outputSize,
                outputPath,
              }

              await this._hooks.callHook('on:finish', this.ctx, result)
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
    const outputPath = (await this._hooks.callHook('on:genOutputPath', this.ctx, { inputPath: filePath })) || filePath
    return outputPath
  }
}
