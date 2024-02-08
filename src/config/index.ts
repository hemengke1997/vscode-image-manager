import { workspace } from 'vscode'
import { normalizePath } from '@/utils'
import { defaultConfig } from './default'

export function getConfig<T>(key: string, v?: T) {
  return workspace.getConfiguration().get(`image-manager.${key}`, (defaultConfig as Record<string, any>)[key] || v)
}

export const Config = {
  get root(): string[] {
    return workspace.workspaceFolders?.map((t) => normalizePath(t.uri.fsPath)) || []
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
      get method(): 'tinypng' | 'sharp' {
        return getConfig('compress.method')
      },
      get tinypngKey(): string {
        return getConfig('compress.tinypngKey')
      },
    }
  },
}

export type ConfigType = typeof Config
