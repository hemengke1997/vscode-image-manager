import { useReducer, useRef, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { createContainer } from 'context-state'
import { produce } from 'immer'

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

  // 所有折叠面板的 id
  const collapseIdSet = useRef<Set<string>>(new Set())

  const [activeCollapseIdSet, setActiveCollapseIdSet] = useState<{
    value: Set<string>
  }>({
    value: new Set(),
  })

  const openAllCollapse = useMemoizedFn(() => {
    setActiveCollapseIdSet(() => ({
      value: new Set(collapseIdSet.current),
    }))
  })

  const closeAllCollapse = useMemoizedFn(() => {
    setActiveCollapseIdSet(() => ({
      value: new Set(),
    }))
  })

  const notifyCollapseChange = useMemoizedFn(() => {
    // 把 collapseIdSet 中不存在的 activeCollapseIdSet 删除
    setActiveCollapseIdSet(
      produce((draft) => {
        for (const id of draft.value) {
          if (!collapseIdSet.current.has(id)) {
            draft.value.delete(id)
          }
        }
      }),
    )
  })

  return {
    imageRefreshedState,
    refreshImages,
    openAllCollapse,
    closeAllCollapse,
    collapseIdSet,
    activeCollapseIdSet,
    setActiveCollapseIdSet,
    notifyCollapseChange,
  }
}

const ActionContext = createContainer(useActionContext)

export default ActionContext
