import { useMemoizedFn } from 'ahooks'
import { type ShowContextMenuParams, useContextMenu } from 'react-contexify'
import { COLLAPSE_CONTEXT_MENU_ID, type EnableCollapseContextMenuType } from '..'

export type CollapseContextMenuType = {
  /**
   * 当前文件夹下的图片
   */
  images: ImageType[]
  /**
   * 当前文件夹下的所有图片（包括子目录）
   */
  underFolderDeeplyImages: ImageType[]
  /**
   * 当前文件夹路径
   */
  path: string
  /**
   * 当前目录下同级的目录
   */
  sameLevelDirs?: string[]
  /**
   * 要显示的菜单项
   * @default true 全部显示
   */
  enable: EnableCollapseContextMenuType
}

export default function useCollapseContextMenu() {
  const contextMenu = useContextMenu<CollapseContextMenuType>()

  const show = useMemoizedFn((params: Omit<ShowContextMenuParams<CollapseContextMenuType>, 'id'>) => {
    return contextMenu.show({
      ...params,
      id: COLLAPSE_CONTEXT_MENU_ID,
    })
  })

  return { show, hideAll: contextMenu.hideAll }
}
