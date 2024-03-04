import { CmdToVscode } from '~/message/cmd'
import { vscodeApi } from '../vscode-api'

/**
 * The configuration target (token from vscode)
 */
export enum ConfigurationTarget {
  /**
   * Global configuration
   */
  Global = 1,

  /**
   * Workspace configuration
   */
  Workspace = 2,

  /**
   * Workspace folder configuration
   */
  WorkspaceFolder = 3,
}

export function useConfiguration() {
  const update = (option: { key: string; value: any; target?: ConfigurationTarget }, callback?: () => void) => {
    const { key, value, target } = option

    // TODO: 会造成渲染卡顿，需要优化
    vscodeApi.postMessage(
      {
        cmd: CmdToVscode.UPDATE_USER_CONFIGURATION,
        data: {
          key,
          value,
          target,
        },
      },
      callback,
    )
  }

  return {
    update,
  }
}
