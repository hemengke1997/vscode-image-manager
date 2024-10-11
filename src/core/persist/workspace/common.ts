import { type ImageFilterType } from '~/webview/image-manager/hooks/use-image-filter/image-filter'

export type SortByType = 'name' | 'size'
export type SortType = 'desc' | 'asc'
export type DisplayGroupType = 'workspace' | 'dir' | 'type'
export type DisplayStyleType = 'compact' | 'nested'

export type WorkspaceStateType = {
  image_filter: ImageFilterType
  display_sort: [SortByType, SortType]
  display_group: DisplayGroupType[]
  display_style: DisplayStyleType
  recent_image_backgroundColors: string[]
  recent_primary_colors: string[]

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
  recent_image_backgroundColors: [],
  recent_primary_colors: [],
  show_precision_tip: true,
  show_undo_redo_tip: true,
}

export const enum WorkspaceStateKey {
  image_filter = 'image_filter',
  display_sort = 'display_sort',
  display_group = 'display_group',
  display_style = 'display_style',
  recent_image_backgroundColors = 'recent_image_backgroundColors',
  recent_primary_colors = 'recent_primary_colors',
  // 精度提示
  show_precision_tip = 'show_precision_tip',
  // 撤销/恢复提示
  show_undo_redo_tip = 'show_undo_redo_tip',
}
