import { get } from '@minko-fe/lodash-pro'
import { type ConfigurationScope, ConfigurationTarget, type WorkspaceConfiguration, workspace } from 'vscode'
import { EXT_NAMESPACE } from '~/meta'
import { normalizePath } from '~/utils'
import { type CompressionOptions, type FormatConverterOptions } from '..'
import { ConfigKey, type ConfigType, DEFAULT_CONFIG } from './common'

export class Config {
  static readonly reloadConfigs = [
    ConfigKey.file_root,
    ConfigKey.file_exclude,
    ConfigKey.file_scan,
    ConfigKey.debug_enabled,
    ConfigKey.debug_forceInstall,
  ]

  static readonly refreshConfigs = [
    ConfigKey.file_confirmDelete,

    ConfigKey.appearance_language,
    ConfigKey.appearance_theme,
    ConfigKey.appearance_primaryColor,
    ConfigKey.appearance_reduceMotion,

    ConfigKey.viewer_warningSize,
    ConfigKey.viewer_imageWidth,
    ConfigKey.viewer_imageBackgroundColor,
    ConfigKey.viewer_imageRendering,

    ConfigKey.compression,
    ConfigKey.conversion,
    ConfigKey.similarity_precision,
  ]

  static get debug_enabled(): boolean {
    return this.getConfig(ConfigKey.debug_enabled)
  }

  static get debug_forceInstall(): boolean {
    return this.getConfig(ConfigKey.debug_forceInstall)
  }

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

  static get viewer_imageRendering(): string {
    return this.getConfig(ConfigKey.viewer_imageRendering)
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

  static get file_revealFileInOsDeeply(): boolean {
    return this.getConfig(ConfigKey.file_revealFileInOsDeeply)
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

  static get conversion_icoSize(): number {
    return this.getConfig(ConfigKey.conversion_icoSize)
  }

  static get similarity_precision(): number {
    return this.getConfig(ConfigKey.similarity_precision)
  }

  static get all() {
    return workspace.getConfiguration(EXT_NAMESPACE) as WorkspaceConfiguration & ConfigType
  }

  static async clearAll() {
    const promises = Object.keys(ConfigKey).map(async (key) => {
      if (Object.prototype.hasOwnProperty.call(ConfigKey, key)) {
        const value = ConfigKey[key]
        await this.updateConfig(value, undefined, ConfigurationTarget.Global)
        await this.updateConfig(value, undefined, ConfigurationTarget.Workspace)
      }
    })

    await Promise.all(promises)
  }

  static updateConfig<T, U extends Flatten<ConfigType> = Flatten<ConfigType>>(
    key: U,
    value: T,
    target: ConfigurationTarget = ConfigurationTarget.Workspace,
  ) {
    return workspace.getConfiguration(EXT_NAMESPACE).update(key, value, target)
  }

  static getConfig<T, U extends Flatten<ConfigType> = Flatten<ConfigType>>(
    key: U, // e.g. `file.root`
    scope?: ConfigurationScope | undefined,
  ): T {
    return workspace.getConfiguration(EXT_NAMESPACE, scope).get<T>(key) ?? get(DEFAULT_CONFIG, key as string)
  }
}
