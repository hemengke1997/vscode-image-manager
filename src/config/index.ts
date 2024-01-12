import path from 'pathe'
import { workspace } from 'vscode'
import { defaultConfig } from './default'

export function getConfig<T>(key: string, v?: T) {
  return workspace.getConfiguration().get(`image-manager.${key}`, (defaultConfig as Record<string, any>)[key] || v)
}

export const Config = {
  get root(): string[] {
    return workspace.workspaceFolders?.map((t) => path.normalize(t.uri.fsPath)) || []
  },

  get warningSize(): number {
    return getConfig('warningSize')
  },

  get imageDefaultWidth(): number {
    return getConfig('imageDefaultWidth')
  },

  get scaleStep(): number {
    return getConfig('scaleStep')
  },

  get exclude(): string[] {
    return getConfig('exclude')
  },

  get imageType(): string[] {
    return getConfig('imageType')
  },

  get compress() {
    return {
      get replace(): boolean {
        return getConfig('compress.replace')
      },
      get method(): 'tinypng' | 'sharp' {
        return getConfig('compress.method')
      },
      get tinypngKey(): string {
        return getConfig('compress.tinypngKey')
      },
      get quality(): number {
        return getConfig('compress.quality')
      },
    }
  },
}

export type ConfigType = typeof Config
export { watchConfig } from './watch-config'
