import { produce } from 'immer'
import { atom } from 'jotai'
import { atomWithReducer } from 'jotai/utils'

// 所有折叠面板的 id
const collapseIdSet = atom<Set<string>>(new Set(''))

// 当前激活的折叠面板 id 集合
const activeCollapseIdSet = atom<Set<string>>(new Set(''))

// 打开所有折叠面板
const openAllCollapse = atom(
  get => get(activeCollapseIdSet),
  (get, set) => {
    const allCollapseIds = get(collapseIdSet)
    set(activeCollapseIdSet, new Set(allCollapseIds))
  },
)

// 关闭所有折叠面板
const closeAllCollapse = atom(
  get => get(activeCollapseIdSet),
  (_get, set) => {
    set(activeCollapseIdSet, new Set())
  },
)

// 通知折叠面板变化
const notifyCollapseChange = atom(null, (get, set) => {
  // 把 collapseIdSet 中不存在的 activeCollapseIdSet 删除
  set(
    activeCollapseIdSet,
    produce((draft) => {
      const currentCollapseIdSet = get(collapseIdSet)
      for (const id of draft) {
        if (!currentCollapseIdSet.has(id)) {
          draft.delete(id)
        }
      }
    }),
  )
})

// 刷新图片
const refreshImage = atomWithReducer(
  {
    refreshTimes: 0,
    refreshType: undefined as 'refresh' | 'slient-refresh' | undefined,
  },
  (
    state,
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

export const ActionAtoms = {
  collapseIdSet,
  activeCollapseIdSet,
  openAllCollapse,
  closeAllCollapse,
  notifyCollapseChange,
  refreshImage,
}
