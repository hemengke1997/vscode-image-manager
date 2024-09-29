import { type ImageFilterType } from '~/webview/image-manager/hooks/use-image-filter/image-filter'

export type SortByType = 'name' | 'size'
export type SortType = 'desc' | 'asc'

export type WorkspaceStateType = {
  image_filter: ImageFilterType
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
  image_filter: {
    size: {
      min: null,
      max: null,
      unit: 'KB',
    },
    compressed: 0,
    git_staged: 0,
    exclude_types: [],
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
  image_filter = 'image_filter',
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
