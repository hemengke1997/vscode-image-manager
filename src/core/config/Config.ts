import { get } from '@minko-fe/lodash-pro'
import { type ConfigurationScope, ConfigurationTarget, workspace } from 'vscode'
import { EXT_NAMESPACE } from '~/meta'
import { normalizePath } from '~/utils'
import { type CompressionOptions, type FormatConverterOptions } from '..'
import { ConfigKey, type ConfigType, DEFAULT_CONFIG } from './common'

export class Config {
  static readonly reloadConfigs = [ConfigKey.file_root, ConfigKey.file_exclude, ConfigKey.file_scan]

  static readonly refreshConfigs = [
    ConfigKey.file_confirmDelete,
    ConfigKey.appearance_language,
    ConfigKey.appearance_theme,
    ConfigKey.appearance_primaryColor,
    ConfigKey.viewer_imageWidth,
    ConfigKey.viewer_warningSize,
    ConfigKey.viewer_imageBackgroundColor,
    ConfigKey.compression,
    ConfigKey.conversion,
    ConfigKey.similarity_precision,
  ]

  static get file_root(): string[] {
    const userRoot = this.getConfig<string[]>(ConfigKey.file_root)
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

  static get file_confirmDelete(): boolean {
    return this.getConfig(ConfigKey.file_confirmDelete)
  }

  static get appearance_theme(): Theme {
    return this.getConfig(ConfigKey.appearance_theme)
  }

  static get appearance_language(): Language {
    return this.getConfig(ConfigKey.appearance_language)
  }

  static get appearance_primaryColor(): string {
    return this.getConfig(ConfigKey.appearance_primaryColor)
  }

  static get mirror_enabled(): boolean {
    return this.getConfig(ConfigKey.mirror_enabled)
  }

  static get mirror_url(): string {
    return this.getConfig(ConfigKey.mirror_url)
  }

  static get compression(): CompressionOptions {
    return this.getConfig(ConfigKey.compression)
  }

  static get conversion(): FormatConverterOptions {
    return this.getConfig(ConfigKey.conversion)
  }

  static get similarity_precision(): number {
    return this.getConfig(ConfigKey.similarity_precision)
  }

  static get all(): ConfigType {
    return workspace.getConfiguration(EXT_NAMESPACE) as any as ConfigType
  }

  static updateConfig<T, U extends ObjectKeys<ConfigType> = ObjectKeys<ConfigType>>(
    key: U,
    value: T,
    target: ConfigurationTarget = ConfigurationTarget.Workspace,
  ) {
    return workspace.getConfiguration(EXT_NAMESPACE).update(key, value, target)
  }

  static getConfig<T, U extends ObjectKeys<ConfigType> = ObjectKeys<ConfigType>>(
    key: U, // like `file.root`
    scope?: ConfigurationScope | undefined,
  ): T {
    return workspace.getConfiguration(EXT_NAMESPACE, scope).get<T>(key) ?? get(DEFAULT_CONFIG, key as string)
  }
}
