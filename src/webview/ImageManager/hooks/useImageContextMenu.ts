import { useMemoizedFn } from '@minko-fe/react-hook'
import { type ShowContextMenuParams, useContextMenu } from 'react-contexify'
import { IMAGE_CONTEXT_MENU_ID } from '../components/ContextMenus/components/ImageContextMenu'

export type ImageContextMenuType = {
  image: ImageType
  /**
   * 同display层级的图片
   */
  sameLevelImages: ImageType[]
  /**
   * 同目录层级的图片
   */
  sameDirImages: ImageType[]
  /**
   * 同个工作区图片（在同一颗singleTree上)
   */
  sameWorkspaceImages: ImageType[]
  /**
   * 是否显示操作相关的菜单
   */
  operable?: boolean
}

export default function useImageContextMenu() {
  const contextMenu = useContextMenu<ImageContextMenuType>()

  const show = useMemoizedFn((params: Omit<ShowContextMenuParams<ImageContextMenuType>, 'id'>) => {
    return contextMenu.show({
      ...params,
      id: IMAGE_CONTEXT_MENU_ID,
    })
  })

  return { show, hideAll: contextMenu.hideAll }
}
