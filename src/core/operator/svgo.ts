import { omit, pick, pickBy } from '@minko-fe/lodash-pro'
import { type Config, type PluginConfig } from 'svgo'
import { type DefaultPlugins } from 'svgo/plugins/plugins-types'
import { type CustomSvgCompressionOptions } from './compressor'
import { type SvgoPlugin, svgoDefaultPlugins } from './meta'

export class Svgo {
  static customOptions: (keyof CustomSvgCompressionOptions)[] = ['compressedAttribute']

  static processConfig(
    _svgOptions: SvgoPlugin & CustomSvgCompressionOptions,
    options: {
      pretty: boolean
    },
  ) {
    // svgo默认启用插件
    const defaultConfig: SvgoPlugin = {}
    // svgo非默认启用插件
    const restConfig: SvgoPlugin = {}

    const svgOptions = omit(_svgOptions, this.customOptions)
    const customOptions = pick(_svgOptions, this.customOptions)

    Object.keys(svgOptions).forEach((k) => {
      const current: boolean = svgOptions[k]
      if (svgoDefaultPlugins.includes(k as keyof DefaultPlugins)) {
        // 如果是svgo的默认插件，则放到defaultConfig中
        defaultConfig[k] = current
      } else if (current) {
        // 如果要启用非默认插件，则要显式设置为true
        restConfig[k] = current
      }
    })

    const defaultPlugin: PluginConfig = {
      name: 'preset-default',
      params: {
        // @see https://svgo.dev/docs/preset-default/#disable-a-plugin
        // 把要禁用默认的插件取出来即可
        overrides: pickBy(defaultConfig, (v) => v === false),
      },
    }

    // 过滤要启用的插件
    const restPlugin: PluginConfig[] = Object.keys(restConfig) as PluginConfig[]

    const config: Config = {
      js2svg: {
        pretty: options.pretty,
      },
      plugins: [
        defaultPlugin,
        ...restPlugin,
        {
          name: 'removeAttrs',
          params: {
            attrs: ['data-.*'],
          },
        },
        {
          name: 'addAttributesToSVGElement',
          params: {
            attributes: customOptions.compressedAttribute
              ? [
                  {
                    [`data-${customOptions.compressedAttribute}`]: '1',
                  },
                ]
              : [],
          },
        },
      ] as PluginConfig[],
    }

    return config
  }

  static isCompressed(svg: string, config: CustomSvgCompressionOptions) {
    if (!config.compressedAttribute) {
      return false
    }
    const regex = new RegExp(`<svg[^>]*?\\sdata-${config.compressedAttribute}=([\\'\\"])1\\1[^>]*>`)
    return regex.test(svg)
  }
}
