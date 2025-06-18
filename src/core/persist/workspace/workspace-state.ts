import { get } from 'es-toolkit/compat'
import { Config } from '~/core/config/config'
import { Global } from '~/core/global'
import { EXT_NAMESPACE } from '~/meta'
import { Channel } from '~/utils/node/channel'
import { DEFAULT_WORKSPACE_STATE, type WorkspaceStateKey, type WorkspaceStateType } from './common'

export class WorkspaceState {
  static readonly DEFAULT_WORKSPACE_STATE = DEFAULT_WORKSPACE_STATE

  static init() {
    Channel.debug('WorkspaceState init')
    this.clear_unused()
  }

  /**
   * @returns 使用过的 workspaceState 的 key
   */
  static usedKeys(): WorkspaceStateKey[] {
    return Global.context.workspaceState
      .keys()
      .filter(k => k.startsWith(EXT_NAMESPACE))
      .map(t => t.slice(EXT_NAMESPACE.length + 1)) as WorkspaceStateKey[]
  }

  /**
   * @returns 当前正在使用的 workspaceState
   */
  static keys() {
    return Object.keys(this.DEFAULT_WORKSPACE_STATE) as WorkspaceStateKey[]
  }

  static get_all() {
    const states = this.keys().reduce((acc, cur) => {
      acc[cur] = this.get(cur)
      return acc
    }, {}) as WorkspaceStateType

    return states
  }

  static async update<T extends WorkspaceStateKey, U>(key: T, value: U) {
    // 多面板模式下，不使用 workspaceState
    if (Config.core_multiplePanels) {
      return
    }
    await Global.context.workspaceState.update(`${EXT_NAMESPACE}.${key}`, value)
  }

  static get<T extends WorkspaceStateKey>(key: T) {
    const defaultValue = get(this.DEFAULT_WORKSPACE_STATE, key)
    // 多面板模式下，不使用 workspaceState
    if (Config.core_multiplePanels) {
      return defaultValue
    }
    return Global.context.workspaceState.get(`${EXT_NAMESPACE}.${key}`, defaultValue)
  }

  static clear(): Promise<void[]> {
    return Promise.all(
      this.keys().map(async (key) => {
        await this.update(key, undefined)
      }),
    )
  }

  static clear_unused() {
    const keys = this.usedKeys()
    const unused = keys.filter(k => !this.keys().includes(k))
    return Promise.all(unused.map(key => this.update(key, undefined)))
  }
}
