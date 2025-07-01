import type { ImageFilterType } from '~/webview/image-manager/hooks/use-image-filter/image-filter'

export enum SortByType {
  // 按文件名排序（命名兼容）
  basename = 'name',
  // 按文件大小排序
  size = 'size',
  // 按文件修改时间排序
  mtime = 'mtime',
}
export enum SortType {
  asc = 'asc',
  desc = 'desc',
}

export enum DisplayGroupType {
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
  display_sort: [SortByType, SortType]
  display_group: DisplayGroupType[]
  display_style: DisplayStyleType
  recent_image_backgroundColors: string[]
  recent_primary_colors: string[]
  show_precision_tip: boolean
  show_undo_redo_tip: boolean
  show_cut_tip: boolean
  preview_scale: number
}

export const DEFAULT_WORKSPACE_STATE: WorkspaceStateType = {
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
  display_sort: [SortByType.basename, SortType.asc],
  display_group: [DisplayGroupType.dir],
  display_style: DisplayStyleType.compact,
  recent_image_backgroundColors: [],
  recent_primary_colors: [],
  show_precision_tip: true,
  show_undo_redo_tip: true,
  show_cut_tip: true,
  preview_scale: 1,
}

export enum WorkspaceStateKey {
  // 图片过滤
  image_filter = 'image_filter',
  // 排序
  display_sort = 'display_sort',
  // 分组方式（目录/文件类型）
  display_group = 'display_group',
  // 展示方式（紧凑/嵌套）
  display_style = 'display_style',
  // 最近使用的图片背景色
  recent_image_backgroundColors = 'recent_image_backgroundColors',
  // 最近使用的主色
  recent_primary_colors = 'recent_primary_colors',
  // 精度提示
  show_precision_tip = 'show_precision_tip',
  // 撤销/恢复提示
  show_undo_redo_tip = 'show_undo_redo_tip',
  // 剪切提示
  show_cut_tip = 'show_cut_tip',
  // 图片缩放比例
  preview_scale = 'preview_scale',
}
