import { useMemo } from 'react'
import { createContainer } from 'context-state'
import { isArray, isObject } from 'lodash-es'
import { WorkspaceStateKey } from '~/core/persist/workspace/common'
import { useWorkspaceState } from '~/webview/hooks/use-workspace-state'
import GlobalContext from './global-context'

function deepTruly(v: object | string[] | number | undefined): boolean {
  if (isArray(v)) {
    return v.length > 0
  }
  if (isObject(v)) {
    return Object.values(v).some((v) => deepTruly(v))
  }
  return !!v
}

function useFilterContext() {
  const { workspaceState } = GlobalContext.usePicker(['workspaceState'])

  /* ---------------- image filter --------------- */
  const [imageFilter, setImageFilter] = useWorkspaceState(WorkspaceStateKey.image_filter, workspaceState.image_filter)

  // 是否启用了筛选条件
  const isImageFilterActive = useMemo(() => deepTruly(imageFilter), [imageFilter])

  return {
    imageFilter,
    setImageFilter,
    isImageFilterActive,
  }
}

const FilterContext = createContainer(useFilterContext)

export default FilterContext
