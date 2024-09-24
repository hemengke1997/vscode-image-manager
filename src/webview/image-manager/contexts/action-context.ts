import { useReducer, useRef, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { createContainer } from 'context-state'

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
  const collapseIdSet = useRef<Set<string>>(new Set())
  const [activeCollapseIdSet, setActiveCollapseIdSet] = useState<Set<string>>(new Set())

  const openAllCollapse = useMemoizedFn(() => {
    setActiveCollapseIdSet(new Set(collapseIdSet.current))
  })

  const closeAllCollapse = useMemoizedFn(() => {
    setActiveCollapseIdSet(new Set())
  })

  return {
    imageRefreshedState,
    refreshImages,
    openAllCollapse,
    closeAllCollapse,
    collapseIdSet,
    activeCollapseIdSet,
    setActiveCollapseIdSet,
  }
}

const ActionContext = createContainer(useActionContext)

export default ActionContext
