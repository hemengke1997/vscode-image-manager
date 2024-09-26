export type SortByType = 'name' | 'size'
export type SortType = 'desc' | 'asc'

export type WorkspaceStateType = {
  display_type: {
    checked: string[]
    unchecked: string[]
  }
  display_sort: [SortByType, SortType]
  display_group: ('workspace' | 'dir' | 'type')[]
  display_style: 'compact' | 'nested'
  rencent_image_backgroundColor: string[]
  rencent_layout_backgroundColor: string[]

  // 调整精确度的提示
  show_precision_tip: boolean
  // 撤销/恢复提示
  show_undo_redo_tip: boolean
}

export const defaultState: WorkspaceStateType = {
  display_type: {
    checked: [],
    unchecked: [],
  },
  display_sort: ['name', 'asc'],
  display_group: ['dir'],
  display_style: 'compact',
  rencent_image_backgroundColor: [],
  rencent_layout_backgroundColor: [],
  show_precision_tip: true,
  show_undo_redo_tip: true,
}

export const enum WorkspaceStateKey {
  display_type = 'display_type',
  display_sort = 'display_sort',
  display_group = 'display_group',
  display_style = 'display_style',
  rencent_image_backgroundColor = 'rencent_image_backgroundColor',
  rencent_layout_backgroundColor = 'rencent_layout_backgroundColor',
  // 精度提示
  show_precision_tip = 'show_precision_tip',
  // 撤销/恢复提示
  show_undo_redo_tip = 'show_undo_redo_tip',
}
