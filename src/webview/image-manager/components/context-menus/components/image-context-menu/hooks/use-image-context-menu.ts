import { type ShowContextMenuParams, useContextMenu } from 'react-contexify'
import { useMemoizedFn } from 'ahooks'
import { merge } from 'lodash-es'
import CtxMenuContext from '~/webview/image-manager/contexts/ctx-menu-context'
import { type EnableImageContextMenuType, IMAGE_CONTEXT_MENU_ID } from '..'

export type ImageContextMenuType = {
  /**
   * 右键选择的图片
   */
  image: ImageType
  /**
   * 图片数组
   */
  images?: ImageType[]
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
  enableContextMenu?: EnableImageContextMenuType
  /**
   * z_commands (类似vscode的z_commands)
   */
  z_commands?: {
    preview?: {
      onClick: (image: ImageType) => void
    }
  }
}

export default function useImageContextMenu() {
  const contextMenu = useContextMenu<ImageContextMenuType>()
  const { setShortCutsVisible } = CtxMenuContext.usePicker(['setShortCutsVisible'])

  const show = useMemoizedFn(
    (
      params: Omit<ShowContextMenuParams<ImageContextMenuType>, 'id'>,
      options: {
        shortcutsVisible?: boolean
      },
    ) => {
      const { shortcutsVisible } = options

      setShortCutsVisible(!shortcutsVisible === false)

      const defaultEnabledContextMenuValue: EnableImageContextMenuType = {
        sharp: false,
        reveal_in_viewer: false,
        fs: false,
        fs_mv: false,
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
        props: {
          ...params.props,
          images: params.props.images?.length ? params.props.images : [params.props.image],
        },
        id: IMAGE_CONTEXT_MENU_ID,
      })
    },
  )

  const hideAll = useMemoizedFn(() => contextMenu.hideAll())

  return { show, hideAll }
}
