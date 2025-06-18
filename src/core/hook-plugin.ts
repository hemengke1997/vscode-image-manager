import { createHooks, type Hookable, type NestedHooks } from 'hookable'
import { ensureArray } from '~/utils'

const PluginIndicator = '__plugin_indicator__'

interface PluginMeta {
  name: string
  enforce?: 'pre' | 'default' | 'post'
}

export interface ObjectPlugin<T extends AnyObject = AnyObject> extends PluginMeta {
  hooks: NestedHooks<T>
}

export function defineOperatorPlugin(plugin: ObjectPlugin): ObjectPlugin {
  return Object.assign(plugin, { [PluginIndicator]: true } as const)
}

export class HookPlugin<T extends AnyObject> {
  pluginMap: Map<string, NestedHooks<T>> = new Map()
  hooks: Hookable<T>

  constructor(option?: { plugins: ObjectPlugin<T>[] }) {
    const { plugins } = option || {}
    this.hooks = createHooks<T>()
    try {
      if (plugins?.length) {
        this.applyPlugins(plugins as ObjectPlugin<T>[])
      }
    }
    catch {}
  }

  applyPlugins(plugins: ObjectPlugin<T>[]) {
    plugins = this.sortPlugins(plugins)

    for (const plugin of plugins) {
      this.applyPlugin(plugin)
    }
    return this
  }

  removePlugins(pluginName: string | string[]) {
    const pluginNames = ensureArray(pluginName)

    const pluginHooks = pluginNames.map(hook => this.pluginMap.get(hook)).filter(t => !!t)

    pluginHooks.forEach((hooks) => {
      this.hooks.removeHooks(hooks)
    })
    pluginNames.forEach((name) => {
      this.pluginMap.delete(name)
    })

    return this
  }

  private applyPlugin(plugin: ObjectPlugin<T>) {
    if (this.pluginMap.has(plugin.name)) {
      this.removePlugins(plugin.name)
    }

    if (plugin.hooks) {
      this.hooks.addHooks(plugin.hooks)
      this.pluginMap.set(plugin.name, plugin.hooks)
    }
  }

  private sortPlugins(plugins: ObjectPlugin<T>[]) {
    const prePlugins: ObjectPlugin<T>[] = []
    const postPlugins: ObjectPlugin<T>[] = []
    const normalPlugins: ObjectPlugin<T>[] = []

    plugins.forEach((plugin) => {
      if (plugin.enforce === 'pre') {
        prePlugins.push(plugin)
      }
      else if (plugin.enforce === 'post') {
        postPlugins.push(plugin)
      }
      else {
        normalPlugins.push(plugin)
      }
    })

    return [...prePlugins, ...normalPlugins, ...postPlugins]
  }
}
