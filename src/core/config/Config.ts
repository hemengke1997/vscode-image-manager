import { deepMerge, get } from '@minko-fe/lodash-pro'
import { ConfigurationTarget, workspace } from 'vscode'
import { EXT_NAMESPACE } from '~/meta'
import { normalizePath } from '~/utils'
import { ConfigKey, type ConfigType, defaultConfig } from './common'

export class Config {
  static readonly reloadConfigs = [ConfigKey.file_root, ConfigKey.file_exclude, ConfigKey.file_scan]

  static readonly refreshConfigs = [
    ConfigKey.appearance_language,
    ConfigKey.appearance_theme,
    ConfigKey.appearance_primaryColor,
    ConfigKey.viewer_imageWidth,
    ConfigKey.viewer_warningSize,
    ConfigKey.viewer_imageBackgroundColor,
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

  static get appearance_primaryColor() {
    return this.getConfig(ConfigKey.appearance_primaryColor)
  }

  static get mirror_enabled() {
    return this.getConfig(ConfigKey.mirror_enabled)
  }

  static get mirror_url() {
    return this.getConfig(ConfigKey.mirror_url)
  }

  static get all() {
    const userConfig = workspace.getConfiguration().get(`${EXT_NAMESPACE}`) as ConfigType
    return deepMerge(defaultConfig, userConfig, { arrayMerge: (_, s) => s })
  }

  static updateConfig<T extends ConfigKey, U>(
    key: T,
    value: U,
    target: ConfigurationTarget = ConfigurationTarget.Workspace,
  ) {
    return workspace.getConfiguration().update(`${EXT_NAMESPACE}.${key}`, value, target)
  }

  private static getConfig<T extends ConfigKey>(key: T) {
    return workspace.getConfiguration().get(`${EXT_NAMESPACE}.${key}`, get(defaultConfig, key))
  }
}
