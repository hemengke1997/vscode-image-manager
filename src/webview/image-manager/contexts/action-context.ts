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
    // 简单的发布订阅，由 updateFlag 控制更新来源
    updateFlag: number
  }>({
    value: new Set(),
    updateFlag: 0,
  })

  const openAllCollapse = useMemoizedFn(() => {
    setActiveCollapseIdSet((t) => ({
      value: new Set(collapseIdSet.current),
      updateFlag: t.updateFlag + 1,
    }))
  })

  const closeAllCollapse = useMemoizedFn(() => {
    setActiveCollapseIdSet((t) => ({
      value: new Set(),
      updateFlag: t.updateFlag + 1,
    }))
  })

  const notifyCollapseChange = useMemoizedFn(() => {
    setActiveCollapseIdSet(
      produce((t) => {
        t.updateFlag += 1
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
