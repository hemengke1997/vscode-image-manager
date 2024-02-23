import { deepMerge } from '@minko-fe/lodash-pro'
import { workspace } from 'vscode'
import { EXT_NAMESPACE } from '~/meta'
import { normalizePath } from '~/utils'
import { type ConfigType, defaultConfig } from './default'

export class Config {
  static defaultConfig = defaultConfig

  static get root(): string[] {
    return workspace.workspaceFolders?.map((t) => normalizePath(t.uri.fsPath)) || []
  }

  static get warningSize(): number {
    return this.getConfig('warningSize')
  }

  static get imageDefaultWidth(): number {
    return this.getConfig('imageDefaultWidth')
  }

  static get scaleStep(): number {
    return this.getConfig('scaleStep')
  }

  static get exclude(): string[] {
    return this.getConfig('exclude')
  }

  static get imageType(): string[] {
    return this.getConfig('imageType')
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
