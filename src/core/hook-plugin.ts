import { createHooks, type Hookable, type NestedHooks } from '@minko-fe/hookable'

const PluginIndicator = '__plugin_indicator__'

interface PluginMeta {
  name: string
  enforce?: 'pre' | 'default' | 'post'
}

export interface ObjectPlugin<RuntimeHooks extends AnyObject = AnyObject> extends PluginMeta {
  hooks: NestedHooks<RuntimeHooks>
  /**
   * Execute plugin in parallel with other parallel plugins.
   * @default false
   */
  parallel?: boolean
}

export function defineOperatorPlugin(plugin: ObjectPlugin): ObjectPlugin {
  return Object.assign(plugin, { [PluginIndicator]: true } as const)
}

export class HookPlugin<RuntimeHooks extends AnyObject = AnyObject> {
  private hooksMap: Map<string, Partial<RuntimeHooks>> = new Map()
  hooks: Hookable<RuntimeHooks>

  constructor(option?: { plugins: ObjectPlugin<RuntimeHooks>[] }) {
    const { plugins } = option || {}
    this.hooks = createHooks<RuntimeHooks>()
    try {
      if (plugins?.length) {
        this._applyPlugins(plugins as ObjectPlugin[])
      }
    } catch {}
  }

  use(plugins: ObjectPlugin[]) {
    this._applyPlugins(plugins)
    return this
  }

  remove(configHooks: Parameters<(typeof this.hooks)['removeHooks']>[0]) {
    this.hooks.removeHooks(configHooks)
    return this
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

  private async _applyPlugin(plugin: ObjectPlugin) {
    if (this.hooksMap.has(plugin.name)) {
      this.remove(this.hooksMap.get(plugin.name)!)
      this.hooksMap.delete(plugin.name)
    }
    if (plugin.hooks) {
      this.hooks.addHooks(plugin.hooks)
      this.hooksMap.set(plugin.name, plugin.hooks)
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
}
