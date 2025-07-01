declare module 'react-contexify' {
  import type { HandlerParamsEvent, ShowContextMenuParams, UseContextMenuParams } from 'react-contexify'

  declare function useContextMenu<TProps>(params?: Partial<UseContextMenuParams<Partial<TProps>>>): {
    show: (params: ShowContextMenuParams<TProps>) => void
    hideAll: () => void
  }
  type HandlerParams<Props = any, Data = any> = {
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
  type ItemParams<Props = any, Data = any> = {
    event:
      | React.MouseEvent<HTMLElement>
      | React.TouchEvent<HTMLElement>
      | React.KeyboardEvent<HTMLElement>
      | KeyboardEvent
  } & HandlerParams<Props, Data>
  type ItemProps = {
    children: ReactNode | ((params: ItemParams) => ReactNode)
  }
}

export {}
