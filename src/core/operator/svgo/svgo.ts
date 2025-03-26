import deepMerge from 'deepmerge'
import { trim } from 'es-toolkit'
import fs from 'fs-extra'
import path from 'node:path'
import { type Config, loadConfig, optimize } from 'svgo'
import { FileCache } from '~/core/file-cache'
import { Channel } from '~/utils/channel'
import { type CustomSvgCompressionOptions } from '../compressor/type'
import { type SvgoPlugin } from './meta'

type AllOptions = SvgoPlugin & CustomSvgCompressionOptions

export class Svgo {
  static customOptions: (keyof CustomSvgCompressionOptions)[] = ['compressedAttribute']

  static get configPath() {
    return path.join(FileCache.cacheDir, 'svgo.config.cjs')
  }

  static init() {
    const svgoConfigPath = Svgo.configPath
    Channel.debug(`svgo配置文件路径: ${svgoConfigPath}`)
    if (!fs.existsSync(svgoConfigPath)) {
      fs.ensureFileSync(svgoConfigPath)
      fs.writeFileSync(
        svgoConfigPath,
        // 来自 ./svgo-default-config.ts
        `module.exports = {
  plugins: [],
}
`,
      )
    }
  }

  static getDefaultPluginConfig(): Config {
    const pluginConfig: Config = {
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {},
          },
        },
      ],
    }

    return pluginConfig
  }

  static async getUserLocalConfig() {
    const config = await loadConfig(require.resolve(this.configPath))
    return config
  }

  static async getConfig(options: AllOptions, config?: Config) {
    const pluginConfig = this.getDefaultPluginConfig()
    const userLocalConfig = await this.getUserLocalConfig()
    const extensionConfig = this.getExtensionConfig(options)

    // 优先级：插件默认配置 < rc动态配置 < 用户本地配置 < 扩展配置
    return deepMerge.all([pluginConfig, config || {}, userLocalConfig, extensionConfig])
  }

  static getExtensionConfig(customOptions: CustomSvgCompressionOptions) {
    const internalConfig: Config = {
      plugins: [],
    }

    // 先移除所有的 data- 开头的属性，再添加自定义属性
    if (customOptions.removeDataAttributes) {
      internalConfig.plugins!.push({
        name: 'removeAttrs',
        params: {
          attrs: ['data-.*'],
        },
      })
    }

    // 添加已压缩属性
    const { compressedAttribute } = customOptions

    if (compressedAttribute && trim(compressedAttribute)) {
      internalConfig.plugins!.push({
        name: 'addAttributesToSVGElement',
        params: {
          attributes: [
            {
              [`data-${trim(compressedAttribute)}`]: '1',
            },
          ],
        },
      })
    }

    return internalConfig
  }

  private static async optimize(svg: string, options: AllOptions, config?: Config) {
    const finalConfig = await this.getConfig(options, config)

    const { data } = optimize(svg, finalConfig)
    return data
  }

  static async minify(svg: string, options: AllOptions) {
    const config: Config = {
      js2svg: {
        pretty: false,
      },
    }

    return await this.optimize(svg, options, config)
  }

  static async prettify(svg: string, options: AllOptions) {
    const config: Config = {
      js2svg: {
        pretty: true,
      },
    }

    return await this.optimize(svg, options, config)
  }

  static isCompressed(svg: string, config: Partial<CustomSvgCompressionOptions>) {
    if (!config.compressedAttribute) {
      return false
    }
    const regex = new RegExp(`<svg[^>]*?\\sdata-${config.compressedAttribute}=([\\'\\"])1\\1[^>]*>`)
    return regex.test(svg)
  }
}
