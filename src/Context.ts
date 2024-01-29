import { deepMerge } from '@minko-fe/lodash-pro'
import { type ExtensionContext, ExtensionMode, window } from 'vscode'
import { type AbsCompressor } from './compress/AbsCompressor'
import { Config, type ConfigType } from './config'
import Watcher from './watcher'

export class Context {
  private _config: ConfigType = Config

  public static instance: Context

  public theme: 'light' | 'dark' = 'dark'
  public compressor: AbsCompressor | undefined

  private constructor(public ext: ExtensionContext) {
    this._initTheme()
  }

  public static init(ext: ExtensionContext) {
    Context.instance = new Context(ext)

    return Context.instance
  }

  private _initTheme() {
    switch (window.activeColorTheme.kind) {
      case 1:
        this.theme = 'light'
        break
      case 2:
        this.theme = 'dark'
        break
      default:
        break
    }
  }

  public setConfig(config: Partial<ConfigType>) {
    this._config = deepMerge(this._config, config, { arrayMerge: (_, s) => s })
  }

  public get config() {
    return this._config
  }

  public get watcher() {
    return new Watcher(this)
  }

  public setCompressor(c: AbsCompressor) {
    this.compressor = c
  }

  public get isProductionMode(): boolean {
    return this.ext.extensionMode === ExtensionMode.Production
  }

  public get isDevMode(): boolean {
    return this.ext.extensionMode === ExtensionMode.Development
  }
}
