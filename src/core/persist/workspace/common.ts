import { type ImageFilterType } from '~/webview/image-manager/hooks/use-image-filter/image-filter'

export enum SortByType {
  // 按文件名排序（命名兼容）
  basename = 'name',
  // 按文件大小排序
  size = 'size',
}
export enum SortType {
  asc = 'asc',
  desc = 'desc',
}

export enum DisplayGroupType {
  // 按工作区分组
  workspace = 'workspace',
  // 按目录分组
  dir = 'dir',
  // 按文件类型分组 (命名兼容)
  extname = 'fileType',
}

export enum DisplayStyleType {
  // 紧凑
  compact = 'compact',
  // 嵌套
  nested = 'nested',
}

export type WorkspaceStateType = {
  image_filter: ImageFilterType
  display_sort: [SortByType, SortByType]
  display_group: DisplayGroupType[]
  display_style: DisplayStyleType
  recent_image_backgroundColors: string[]
  recent_primary_colors: string[]

  // 调整精确度的提示
  show_precision_tip: boolean
  // 撤销/恢复提示
  show_undo_redo_tip: boolean
  // 剪切提示
  show_cut_tip: boolean
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
  display_sort: [SortByType.basename, SortByType.size],
  display_group: [DisplayGroupType.dir],
  display_style: DisplayStyleType.compact,
  recent_image_backgroundColors: [],
  recent_primary_colors: [],
  show_precision_tip: true,
  show_undo_redo_tip: true,
  show_cut_tip: true,
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
  // 剪切提示
  show_cut_tip = 'show_cut_tip',
}
