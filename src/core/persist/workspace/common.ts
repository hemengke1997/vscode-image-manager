export type WorkspaceStateType = {
  display_type: {
    checked: string[]
    unchecked: string[]
  }
  display_sort: string[]
  display_group: ('workspace' | 'dir' | 'type')[]
  display_style: 'compact' | 'nested'
  viewer_mode: 'standard' | 'simple'
  rencent_image_backgroundColor: string[]
  rencent_layout_backgroundColor: string[]
}

export const defaultState: WorkspaceStateType = {
  display_type: {
    checked: [],
    unchecked: [],
  },
  display_sort: ['size', 'asc'],
  display_group: ['dir'],
  display_style: 'compact',
  viewer_mode: 'standard',
  rencent_image_backgroundColor: [],
  rencent_layout_backgroundColor: [],
}

export const enum WorkspaceStateKey {
  display_type = 'display_type',
  display_sort = 'display_sort',
  display_group = 'display_group',
  display_style = 'display_style',
  viewer_mode = 'viewer_mode',
  rencent_image_backgroundColor = 'rencent_image_backgroundColor',
  rencent_layout_backgroundColor = 'rencent_layout_backgroundColor',
}
