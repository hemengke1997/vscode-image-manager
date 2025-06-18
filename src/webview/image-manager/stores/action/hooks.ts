import { useMemoizedFn } from 'ahooks'
import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { WorkspaceStateKey } from '~/core/persist/workspace/common'
import { useWorkspaceState } from '../../hooks/use-workspace-state'
import { VscodeAtoms } from '../vscode/vscode-store'

// image filter
export function useImageFilter() {
  const _imageFilter = useAtomValue(
    selectAtom(
      VscodeAtoms.workspaceStateAtom,
      useMemoizedFn(state => state.image_filter),
    ),
  )
  const [imageFilter, setImageFilter] = useWorkspaceState(WorkspaceStateKey.image_filter, _imageFilter)
  return [imageFilter, setImageFilter] as const
}
