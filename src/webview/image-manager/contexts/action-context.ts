import { useMemoizedFn } from 'ahooks'
import { createContainer } from 'context-state'
import { useReducer } from 'react'
import { useControlledState } from 'x-ahooks'

function useActionContext() {
  /* --------------- refresh image -------------- */
  const refreshImageReducer = useMemoizedFn(
    (
      state: { refreshTimes: number },
      action: {
        type:
          | 'refresh' // 带通知刷新，用户主动刷新
          | 'slient-refresh' // 无通知刷新，被动刷新（可能来自于vscode等操作）
          | undefined
      },
    ) => {
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

  return {
    imageRefreshedState,
    refreshImages,
    collapseOpen,
    setCollapseOpen,
  }
}

const ActionContext = createContainer(useActionContext)

export default ActionContext
