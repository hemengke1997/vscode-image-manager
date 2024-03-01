import { deepMerge } from '@minko-fe/lodash-pro'
import { workspace } from 'vscode'
import { EXT_NAMESPACE } from '~/meta'
import { normalizePath } from '~/utils'
import { ConfigKey, type ConfigType, defaultConfig } from './common'

export class Config {
  static readonly reloadConfigs = [ConfigKey.file_root, ConfigKey.file_exclude, ConfigKey.file_scan]

  static readonly refreshConfigs = [
    ConfigKey.appearance_language,
    ConfigKey.appearance_theme,
    ConfigKey.viewer_imageWidth,
    ConfigKey.viewer_warningSize,
  ]

  static defaultConfig = defaultConfig

  static get file_root(): string[] {
    const userRoot = this.getConfig(ConfigKey.file_root)
    if (userRoot?.length) return userRoot
    return workspace.workspaceFolders?.map((t) => normalizePath(t.uri.fsPath)) || []
  }

  static get viewer_warningSize(): number {
    return this.getConfig(ConfigKey.viewer_warningSize)
  }

  static get viewer_imageWidth(): number {
    return this.getConfig(ConfigKey.viewer_imageWidth)
  }

  static get viewer_imageBackgroundColor(): string {
    return this.getConfig(ConfigKey.viewer_imageBackgroundColor)
  }

  static get file_exclude(): string[] {
    return this.getConfig(ConfigKey.file_exclude)
  }

  static get file_scan(): string[] {
    return this.getConfig(ConfigKey.file_scan)
  }

  static get appearance_theme() {
    return this.getConfig(ConfigKey.appearance_theme)
  }

  static get appearance_language() {
    return this.getConfig(ConfigKey.appearance_language)
  }

  static get all() {
    const userConfig = workspace.getConfiguration().get(`${EXT_NAMESPACE}`) as ConfigType
    return deepMerge(defaultConfig, userConfig, { arrayMerge: (_, s) => s })
  }

  private static getConfig<T>(key: string, v?: T) {
    return workspace
      .getConfiguration()
      .get(`${EXT_NAMESPACE}.${key}`, (this.defaultConfig as Record<string, any>)[key] || v)
  }
}
