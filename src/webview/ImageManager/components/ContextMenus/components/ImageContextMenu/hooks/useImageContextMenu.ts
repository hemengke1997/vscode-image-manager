import { merge } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { type ShowContextMenuParams, useContextMenu } from 'react-contexify'
import { type EnableImageContextMenuType, IMAGE_CONTEXT_MENU_ID } from '..'

export type ImageContextMenuType = {
  image: ImageType
  /**
   * 同display层级的图片
   */
  sameLevelImages?: ImageType[]
  /**
   * 同个工作区图片（在同一颗singleTree上)
   */
  sameWorkspaceImages?: ImageType[]
  /**
   * 要显示的菜单项
   * @default
   * ```ts
   * {
   *    sharp: false,
   *    reveal_in_viewer: false,
   *    fs: false,
   *    svg_pretty: false,
   * }
   * ```
   */
  enable?: EnableImageContextMenuType
}

export default function useImageContextMenu() {
  const contextMenu = useContextMenu<ImageContextMenuType>()

  const show = useMemoizedFn((params: Omit<ShowContextMenuParams<ImageContextMenuType>, 'id'>) => {
    const defaultEnabledContextMenuValue: EnableImageContextMenuType = {
      sharp: false,
      reveal_in_viewer: false,
      fs: false,
      svg: false,
    }

    params.props = merge(
      {
        enable: defaultEnabledContextMenuValue,
      },
      params.props,
    )

    return contextMenu.show({
      ...params,
      id: IMAGE_CONTEXT_MENU_ID,
    })
  })

  return { show, hideAll: contextMenu.hideAll }
}
