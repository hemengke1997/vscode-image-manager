import { useControlledState, useMemoizedFn } from '@minko-fe/react-hook'
import { createContainer } from 'context-state'
import { useReducer, useState } from 'react'

export type SizeFilterType =
  | {
      active: boolean
      value: { min?: number; max?: number }
    }
  | undefined

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
  const [sizeFilter, setSizeFilter] = useState<SizeFilterType>()

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
  const [imageSearchOpen, setImageSearchOpen] = useState(false)

  return {
    imageRefreshedState,
    refreshImages,
    collapseOpen,
    setCollapseOpen,
    sizeFilter,
    setSizeFilter,
    imageSearchOpen,
    setImageSearchOpen,
  }
}

const ActionContext = createContainer(useActionContext)

export default ActionContext
