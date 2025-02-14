import { useState } from 'react'
import { createContainer } from 'context-state'
import { type ConfigType, type VscodeConfigType } from '~/core/config/common'
import { type WorkspaceStateType } from '~/core/persist/workspace/common'

function useVscodeContext(initial: {
  extConfig: ConfigType
  vscodeConfig: VscodeConfigType
  workspaceState: WorkspaceStateType
}) {
  // 扩展配置
  const [extConfig, setExtConfig] = useState(initial.extConfig)

  // vscode配置
  const [vscodeConfig, setVscodeConfig] = useState(initial.vscodeConfig)

  // 工作区缓存
  const [workspaceState, setWorkspaceState] = useState(initial.workspaceState)

  return {
    extConfig,
    setExtConfig,
    vscodeConfig,
    setVscodeConfig,
    workspaceState,
    setWorkspaceState,
  }
}

const VscodeContext = createContainer(useVscodeContext)

export default VscodeContext
