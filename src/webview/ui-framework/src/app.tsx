import { memo } from 'react'
import { type ConfigType, type VscodeConfigType } from '~/core/config/common'
import { type WorkspaceStateType } from '~/core/persist/workspace/common'
import VscodeContext from './contexts/vscode-context'

type AppProps = {
  children: React.ReactNode
  extConfig: ConfigType
  vscodeConfig: VscodeConfigType
  workspaceState: WorkspaceStateType
}

function App(props: AppProps) {
  const { children, extConfig, vscodeConfig, workspaceState } = props

  return (
    <div onContextMenu={(e) => e.preventDefault()}>
      <VscodeContext.Provider value={{ extConfig, vscodeConfig, workspaceState }}>{children}</VscodeContext.Provider>
    </div>
  )
}

export default memo(App)
