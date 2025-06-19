import type { EnableCollapseContextMenuType } from '../../../context-menus/components/collapse-context-menu'
import type { NestedTreeNode, TreeManager } from '~/webview/image-manager/utils/tree/tree-manager'
import { useMemoizedFn } from 'ahooks'
import { Card, type CollapseProps, Empty } from 'antd'
import { isUndefined } from 'es-toolkit'
import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { motion } from 'motion/react'
import { memo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { VscFileMedia } from 'react-icons/vsc'
import { DisplayGroupType } from '~/core/persist/workspace/common'
import { ActionAtoms } from '~/webview/image-manager/stores/action/action-store'
import { imageStateAtom } from '~/webview/image-manager/stores/image/image-store'
import { useDisplayGroup } from '~/webview/image-manager/stores/settings/hooks'
import { ANIMATION_DURATION } from '~/webview/image-manager/utils/duration'
import { NodeType } from '~/webview/image-manager/utils/tree/tree'
import { classNames } from '~/webview/image-manager/utils/tw-clsx'
import ImageCollapse from '../image-collapse'
import RevealInFolder from '../reveal-in-folder'
import styles from './index.module.css'

interface Props {
  tree: NestedTreeNode[] | undefined
  treeManager: TreeManager | undefined
  workspaceId: string
  workspaceFolder: string
}
function TreeRenderer(props: Props) {
  const { t } = useTranslation()
  const { tree, treeManager, workspaceFolder, workspaceId } = props

  const workspaceLength = useAtomValue(
    selectAtom(
      imageStateAtom,
      useMemoizedFn(state => state.workspaces.length),
    ),
  )

  const [displayGroup] = useDisplayGroup()

  const collapseIdSet = useAtomValue(ActionAtoms.collapseIdSet)

  /**
   * nodeID是以工作区名称开头的，需要去掉工作区名称，然后加上工作区绝对路径
   * @returns 目录的完整路径
   */
  const resolvePath = useMemoizedFn((nodeId: string) => {
    if (nodeId === workspaceFolder)
      return workspaceId

    return nodeId.replace(new RegExp(`^${workspaceFolder}`), `${workspaceId}`)
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
          icon: () => <VscFileMedia className='mr-1' />,
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
      if (!tree.length)
        return null

      const { root } = options || {}

      return (
        <div className='select-none space-y-2'>
          {tree.map((node) => {
            const { data, id, children } = node

            const resolvedId = resolvePath(id)
            collapseIdSet.add(resolvedId)

            if (!data)
              return null

            // 非根节点，或者多工作区时，可以折叠
            const collapsible = !root || workspaceLength > 1

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
                labelRender={label => (
                  <div className='flex items-center space-x-1'>
                    <div className='flex items-center'>{fnStrategy(data.nodeType).icon({ path: resolvedId })}</div>
                    {label}
                  </div>
                )}
                contextMenu={
                  fnStrategy(data.nodeType).contextMenu
                    ? id =>
                      fnStrategy(data.nodeType).contextMenu!({
                        rename_directory: id !== workspaceId,
                        delete_directory: id !== workspaceId,
                      })
                    : undefined
                }
                label={data.path!}
                images={data.images}
                workspaceFolder={workspaceFolder}
                folderImages={treeManager?.getNodeImages(id)}
                subfolderImages={treeManager?.getSubnodeImages(id)}
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

  if (isUndefined(tree)) {
    return null
  }

  if (!tree.length) {
    return (
      <motion.div
        initial={{
          opacity: 0,
          transition: {
            delay: ANIMATION_DURATION.fast,
          },
        }}
        animate={{
          opacity: 1,
        }}
      >
        <Card
          title={<div className='text-ant-color-warning'>{workspaceFolder}</div>}
          variant='borderless'
          type='inner'
        >
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('im.no_image')} />
        </Card>
      </motion.div>
    )
  }

  // render tree
  return nestedDisplay(tree, { bordered: true }, { root: true })
}

function RevealGroup(props: { path: string, folderChildren?: ReactNode }) {
  return (
    <div className='flex items-center gap-x-1'>
      <RevealInFolder {...props}>{props.folderChildren}</RevealInFolder>
    </div>
  )
}

export default memo(TreeRenderer)
