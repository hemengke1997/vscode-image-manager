export type WorkspaceStateType = {
  display_type: {
    checked: string[]
    unchecked: string[]
  }
  display_sort: string[]
  display_group: ('workspace' | 'dir' | 'type')[]
  display_style: 'compact' | 'nested'
  viewer_mode: 'standard' | 'simple'
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
}

export enum WorkspaceStateKey {
  display_type = 'display_type',
  display_sort = 'display_sort',
  display_group = 'display_group',
  display_style = 'display_style',
  viewer_mode = 'viewer_mode',
}
