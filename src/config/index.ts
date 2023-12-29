import { workspace } from 'vscode'
import { defaultConfig } from './default'

export function getConfig<T>(key: string, v?: T) {
  return workspace.getConfiguration().get(`image-analysor.${key}`, (defaultConfig as Record<string, any>)[key] || v)
}

export const Config = {
  get root() {
    return workspace.workspaceFolders?.[0]?.uri?.fsPath || ''
  },

  get warningSize() {
    return getConfig('warningSize')
  },

  get imageDefaultWidth() {
    return getConfig('imageDefaultWidth')
  },

  get scaleStep() {
    return getConfig('scaleStep')
  },
}

export type ConfigType = typeof Config
