import { useControlledState, useMemoizedFn } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useReducer, useState } from 'react'

function useActionContext() {
  /* --------------- refresh image -------------- */
  const refreshImageReducer = useMemoizedFn(
    (state: { refreshTimes: number }, action: { type: 'refresh' | 'sort' | 'slientRefresh' | undefined }) => {
      return {
        refreshTimes: state.refreshTimes + 1,
        refreshType: action?.type,
      }
    },
  )

  const [imageRefreshedState, refreshImages] = useReducer(refreshImageReducer, {
    refreshTimes: 0,
    refreshType: undefined,
  })

  /* ---------------- size filter --------------- */
  const [sizeFilter, setSizeFilter] = useState<{
    active: boolean
    value: { min?: number; max?: number }
  }>()

  /* -------------- image collapse -------------- */

  // Negative number means close collapse
  // otherwise, open collapse
  // Zero means no change
  const [collapseOpen, setCollapseOpen] = useControlledState<number>({
    defaultValue: 0,
    beforeValue(value, prevValue) {
      if (value > prevValue) {
        return Math.abs(value) || 1
      } else {
        return -Math.abs(value) || -1
      }
    },
  })

  /* ------------- search modal open ------------ */
  const [searchModalOpen, setSearchModalOpen] = useState(false)

  return {
    imageRefreshedState,
    refreshImages,
    collapseOpen,
    setCollapseOpen,
    sizeFilter,
    setSizeFilter,
    searchModalOpen,
    setSearchModalOpen,
  }
}

const ActionContext = createContainer(useActionContext)

export default ActionContext