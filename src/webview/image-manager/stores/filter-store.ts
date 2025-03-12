import { useMemo } from 'react'
import { createStore } from 'context-state'
import { diff } from 'deep-object-diff'
import { flatten } from 'flat'
import removeUndefinedObjects from 'remove-undefined-objects'
import { defaultState, WorkspaceStateKey } from '~/core/persist/workspace/common'
import { useWorkspaceState } from '~/webview/image-manager/hooks/use-workspace-state'
import GlobalStore from './global-store'

function useFilterStore() {
  const { workspaceState } = GlobalStore.useStore(['workspaceState'])

  /* ---------------- image filter --------------- */
  const [imageFilter, setImageFilter] = useWorkspaceState(WorkspaceStateKey.image_filter, workspaceState.image_filter)

  // 是否启用了筛选条件
  const isImageFilterActive = useMemo(() => {
    const diffs = diff(
      removeUndefinedObjects(defaultState.image_filter) || {},
      removeUndefinedObjects(imageFilter) || {},
    )
    const diffKeys = Object.keys(flatten(diffs))
    const ignoreKeys = ['size.unit']

    return diffKeys.filter((key) => !ignoreKeys.includes(key)).length
  }, [imageFilter])

  return {
    imageFilter,
    setImageFilter,
    isImageFilterActive,
  }
}

const FilterStore = createStore(useFilterStore)

export default FilterStore
