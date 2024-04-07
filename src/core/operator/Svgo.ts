import { pickBy } from '@minko-fe/lodash-pro'
import { type Config, type PluginConfig } from 'svgo'
import { type DefaultPlugins } from 'svgo/plugins/plugins-types'
import { type SvgoPlugin, svgoDefaultPlugins } from './meta'

export class Svgo {
  static processConfig(
    svgOptions: SvgoPlugin,
    options: {
      pretty: boolean
    },
  ) {
    const defaultConfig: SvgoPlugin = {}
    const restConfig: SvgoPlugin = {}
    Object.keys(svgOptions).forEach((k) => {
      const current = svgOptions[k]
      if (svgoDefaultPlugins.includes(k as keyof DefaultPlugins)) {
        defaultConfig[k] = current
      } else {
        restConfig[k] = current
      }
    })
    const defaultPlugin: PluginConfig = {
      name: 'preset-default',
      params: {
        overrides: pickBy(defaultConfig, (v) => v === false),
      },
    }

    const restPlugin: PluginConfig[] = Object.keys(pickBy(restConfig, (v) => v === true)) as PluginConfig[]

    const config: Config = {
      js2svg: {
        pretty: options.pretty,
      },
      plugins: [defaultPlugin, ...restPlugin],
    }

    return config
  }
}
