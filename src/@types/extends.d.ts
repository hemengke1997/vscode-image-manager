declare module 'react-contexify' {
  import type { HandlerParamsEvent, ShowContextMenuParams, UseContextMenuParams } from 'react-contexify'

  declare function useContextMenu<TProps>(params?: Partial<UseContextMenuParams<Partial<TProps>>>): {
    show: (params: ShowContextMenuParams<TProps>) => void
    hideAll: () => void
  }
  interface HandlerParams<Props = any, Data = any> {
    /**
     * The id of the item when provided
     */
    id?: string
    /**
     * The event that triggered the context menu
     */
    triggerEvent: HandlerParamsEvent
    /**
     * Any props supplied when triggering the menu
     */
    props?: Props
    /**
     * Data object provided to item
     */
    data?: Data
  }
  interface ItemParams<Props = any, Data = any> extends HandlerParams<Props, Data> {
    event:
      | React.MouseEvent<HTMLElement>
      | React.TouchEvent<HTMLElement>
      | React.KeyboardEvent<HTMLElement>
      | KeyboardEvent
  }
  interface ItemProps {
    children: ReactNode | ((params: ItemParams) => ReactNode)
  }
}

export {}
