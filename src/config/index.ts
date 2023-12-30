import { workspace } from 'vscode'
import { defaultConfig } from './default'

export function getConfig<T>(key: string, v?: T) {
  return workspace.getConfiguration().get(`image-analysor.${key}`, (defaultConfig as Record<string, any>)[key] || v)
}

export const Config = {
  get root(): string {
    return workspace.workspaceFolders?.[0]?.uri?.fsPath || ''
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

  get excludePath(): string[] {
    return getConfig('excludePath')
  },
}

export type ConfigType = typeof Config
