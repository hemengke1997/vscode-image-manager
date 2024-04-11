declare module 'react-contexify' {
  import { type ShowContextMenuParams, type UseContextMenuParams } from 'react-contexify'
  declare function useContextMenu<TProps>(params?: Partial<UseContextMenuParams<Partial<TProps>>>): {
    show: (params: ShowContextMenuParams<TProps>) => void
    hideAll: () => void
  }
}

export {}
