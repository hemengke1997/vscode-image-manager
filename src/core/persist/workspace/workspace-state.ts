import { get } from 'es-toolkit/compat'
import { type Webview } from 'vscode'
import { Global } from '~/core'
import { EXT_NAMESPACE } from '~/meta'
import { ImageManagerPanel } from '~/webview/panel'
import { DEFAULT_WORKSPACE_STATE, type WorkspaceStateKey, type WorkspaceStateType } from './common'

export class WorkspaceState {
  static readonly DEFAULT_WORKSPACE_STATE = DEFAULT_WORKSPACE_STATE
  public static webview: Webview | undefined

  static init() {
    ImageManagerPanel.onDidChange((e) => {
      if (e) {
        // webview opened
        this.webview = e
      } else {
        // webview closed
        this.webview = undefined
      }
    })
    this.clear_unused()
  }

  /**
   * @returns 使用过的 workspaceState 的 key
   */
  static usedKeys(): WorkspaceStateKey[] {
    return Global.context.workspaceState
      .keys()
      .filter((k) => k.startsWith(EXT_NAMESPACE))
      .map((t) => t.slice(EXT_NAMESPACE.length + 1)) as WorkspaceStateKey[]
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
    await Global.context.workspaceState.update(`${EXT_NAMESPACE}.${key}`, value)
  }

  static get<T extends WorkspaceStateKey>(key: T) {
    return Global.context.workspaceState.get(`${EXT_NAMESPACE}.${key}`, get(this.DEFAULT_WORKSPACE_STATE, key))
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
    const unused = keys.filter((k) => !this.keys().includes(k))
    return Promise.all(unused.map((key) => this.update(key, undefined)))
  }
}
