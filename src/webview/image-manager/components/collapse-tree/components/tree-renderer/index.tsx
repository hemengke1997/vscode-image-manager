import { memo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { VscFileMedia } from 'react-icons/vsc'
import { Transition } from 'react-transition-preset'
import { useMemoizedFn } from 'ahooks'
import { Card, type CollapseProps, Empty } from 'antd'
import { classNames } from 'tw-clsx'
import { DisplayGroupType } from '~/core/persist/workspace/common'
import ActionStore from '~/webview/image-manager/stores/action-store'
import GlobalStore from '~/webview/image-manager/stores/global-store'
import SettingsStore from '~/webview/image-manager/stores/settings-store'
import { ANIMATION_DURATION } from '~/webview/image-manager/utils/duration'
import { NodeType } from '~/webview/image-manager/utils/tree/tree'
import { type NestedTreeNode, type TreeManager } from '~/webview/image-manager/utils/tree/tree-manager'
import { type EnableCollapseContextMenuType } from '../../../context-menus/components/collapse-context-menu'
import ImageCollapse from '../image-collapse'
import RevealInFolder from '../reveal-in-folder'
import styles from './index.module.css'

type Props = {
  tree: NestedTreeNode[]
  treeManager: TreeManager | undefined
  workspaceId: string
  workspaceFolder: string
}
function TreeRenderer(props: Props) {
  const { t } = useTranslation()
  const { tree, treeManager, workspaceFolder, workspaceId } = props

  const workspaceLength = GlobalStore.useStore((ctx) => ctx.imageState.workspaces.length)

  const { displayGroup } = SettingsStore.useStore(['displayGroup'])

  const { collapseIdSet } = ActionStore.useStore(['collapseIdSet'])

  /**
   * 根据ID解析路径
   * 因为ID是以工作区名称开头的，所以需要去掉工作区名称
   * 并且加上工作区绝对路径
   */
  const resolvePath = useMemoizedFn((id: string) => {
    const path = id.split('/').slice(1).join('/')
    return `${workspaceId}/${path}`
  })

  const getContextMenu = useMemoizedFn((contextMenu: EnableCollapseContextMenuType): EnableCollapseContextMenuType => {
    return {
      compress_in_current_directory: true,
      compress_in_recursive_directories: true,
      format_conversion_in_current_directory: true,
      format_conversion_in_recursive_directories: true,
      open_in_os_explorer: true,
      open_in_vscode_explorer: true,
      ...contextMenu,
    }
  })

  const fnStrategy = useMemoizedFn((nodeType: NodeType) => {
    switch (nodeType) {
      case NodeType.dir: {
        return {
          icon: (props: { path: string }) => <RevealGroup {...props} />,
          contextMenu: getContextMenu,
        }
      }
      case NodeType.ext: {
        return {
          icon: () => <VscFileMedia className={'mr-1'} />,
        }
      }
      case NodeType.root: {
        return {
          icon: (props: { path: string }) => <RevealGroup {...props} />,
          contextMenu: getContextMenu,
        }
      }
      default:
        return {
          icon: (props: { path: string }) => <RevealGroup {...props} />,
          contextMenu: getContextMenu,
        }
    }
  })

  const nestedDisplay = useMemoizedFn(
    (
      tree: NestedTreeNode[],
      collapseProps?: CollapseProps,
      options?: {
        root?: boolean
      },
    ) => {
      if (!tree.length) return null

      const { root } = options || {}

      return (
        <div className={'select-none space-y-2'}>
          {tree.map((node) => {
            const { data, id, children } = node
            const resolvedId = resolvePath(id)

            collapseIdSet.current.add(resolvedId)

            if (!data) return null

            // 非根节点，或者多工作区时，可以折叠
            const collapsible = !root || workspaceLength > 1

            // 全路径

            return (
              <ImageCollapse
                key={resolvedId}
                id={resolvedId}
                collapseProps={{
                  bordered: false,
                  className: classNames(styles.collapse),
                  ...collapseProps,
                }}
                collapsible={collapsible}
                // 不能折叠时，强制展开
                forceOpen={!collapsible ? true : undefined}
                labelRender={(label) => (
                  <div className={'flex items-center space-x-1'}>
                    <div className={'flex items-center'}>{fnStrategy(data.nodeType).icon({ path: resolvedId })}</div>
                    {label}
                  </div>
                )}
                contextMenu={
                  fnStrategy(data.nodeType).contextMenu
                    ? (id) =>
                        fnStrategy(data.nodeType).contextMenu!({
                          rename_directory: id !== workspaceFolder,
                          delete_directory: id !== workspaceFolder,
                        })
                    : undefined
                }
                label={data.path!}
                images={data.images}
                workspaceFolder={workspaceFolder}
                folderImages={treeManager?.getImages(id)}
                subfolderImages={treeManager?.getAllImages(id)}
                tooltipDisplayFullPath={!displayGroup.includes(DisplayGroupType.dir)}
              >
                {data.path && children ? nestedDisplay(children) : null}
              </ImageCollapse>
            )
          })}
        </div>
      )
    },
  )

  if (!tree.length) {
    return (
      <Transition mounted={true} initial={true} enterDelay={ANIMATION_DURATION.fast}>
        {(style) => (
          <div style={style}>
            <Card
              title={<div className={'text-ant-color-warning'}>{workspaceFolder}</div>}
              variant={'borderless'}
              type='inner'
            >
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('im.no_image')} />
            </Card>
          </div>
        )}
      </Transition>
    )
  }

  // render tree
  return nestedDisplay(tree, { bordered: true }, { root: true })
}

function RevealGroup(props: { path: string; folderChildren?: ReactNode }) {
  return (
    <div className={'flex items-center gap-x-1'}>
      <RevealInFolder {...props}>{props.folderChildren}</RevealInFolder>
    </div>
  )
}

export default memo(TreeRenderer)
