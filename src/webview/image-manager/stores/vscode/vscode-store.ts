import type { ConfigType, VscodeConfigType } from '~/core/config/common'
import type { WorkspaceStateType } from '~/core/persist/workspace/common'
import { atom } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'

export const VscodeAtoms = {
  extConfigAtom: atom<ConfigType>({} as ConfigType),
  vscodeConfigAtom: atom<VscodeConfigType>({} as VscodeConfigType),
  workspaceStateAtom: atom<WorkspaceStateType>({} as WorkspaceStateType),
}

export function VscodeAtomsHydrator({
  extConfig,
  vscodeConfig,
  workspaceState,
  children,
}: {
  extConfig: ConfigType
  vscodeConfig: VscodeConfigType
  workspaceState: WorkspaceStateType
  children: React.ReactNode
}) {
  useHydrateAtoms([
    [VscodeAtoms.extConfigAtom, extConfig],
    [VscodeAtoms.vscodeConfigAtom, vscodeConfig],
    [VscodeAtoms.workspaceStateAtom, workspaceState],
  ])

  return children
}
