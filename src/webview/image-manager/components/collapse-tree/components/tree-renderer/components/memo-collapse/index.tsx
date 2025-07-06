import type { CollapseProps, GetProps } from 'antd'
import type { ReactNode } from 'react'
import type TreeRenderer from '../..'
import type { EnableCollapseContextMenuType } from '~/webview/image-manager/components/context-menus/components/collapse-context-menu'
import type { NestedTreeNode, TreeData } from '~/webview/image-manager/utils/tree/tree-manager'
import { useMemoizedFn } from 'ahooks'
import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { memo, useMemo } from 'react'
import { VscFileMedia } from 'react-icons/vsc'
import { DisplayGroupType } from '~/core/persist/workspace/common'
import { ActionAtoms } from '~/webview/image-manager/stores/action/action-store'
import { imageStateAtom } from '~/webview/image-manager/stores/image/image-store'
import { useDisplayGroup } from '~/webview/image-manager/stores/settings/hooks'
import { NodeType } from '~/webview/image-manager/utils/tree/tree'
import { classNames } from '~/webview/image-manager/utils/tw-clsx'
import ImageCollapse from '../../../image-collapse'
import RevealInFolder from '../../../reveal-in-folder'
import styles from './index.module.css'

type Props = {
  data: TreeData
  id: string
  resolvedId: string
  isRoot?: boolean
  collapseProps?: CollapseProps
  tree: NestedTreeNode[] | undefined
  renderTree: (tree: NestedTreeNode[]) => JSX.Element | null
} & GetProps<typeof TreeRenderer>

const RevealGroup = memo((props: { path: string, folderChildren?: ReactNode }) => {
  return (
    <div className='flex items-center gap-x-1'>
      <RevealInFolder {...props}>{props.folderChildren}</RevealInFolder>
    </div>
  )
})

function MemoCollapse(props: Props) {
  const { data, workspaceFolder, workspaceId, id, isRoot, collapseProps, treeManager, renderTree, resolvedId, tree } = props

  // 优化状态访问，使用 selectAtom 减少不必要的重新渲染
  const workspaceLength = useAtomValue(
    selectAtom(
      imageStateAtom,
      useMemoizedFn(state => state.workspaces.length),
    ),
  )

  const [displayGroup] = useDisplayGroup()

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

  const strategies = useMemo(() => {
    return {
      [NodeType.dir]: {
        icon: (props: { path: string }) => <RevealGroup {...props} />,
        contextMenu: getContextMenu,
      },
      [NodeType.ext]: {
        icon: () => <VscFileMedia className='mr-1' />,
        contextMenu: null,
      },
      [NodeType.root]: {
        icon: (props: { path: string }) => <RevealGroup {...props} />,
        contextMenu: getContextMenu,
      },
    }
  }, [])

  // 记忆化策略函数，避免每次渲染都重新创建
  const fnStrategy = useMemo(() => {
    return (nodeType: NodeType) => {
      return strategies[nodeType] || strategies[NodeType.dir]
    }
  }, [strategies])

  // 这个状态是稳定的
  const collapseIdSet = useAtomValue(ActionAtoms.collapseIdSet)
  collapseIdSet.add(resolvedId)

  // 非根节点，或者多工作区时，可以折叠
  const collapsible = !isRoot || workspaceLength > 1

  const { contextMenu } = fnStrategy(data.nodeType)
  const memoedContextMenu = useMemoizedFn((id: string) => {
    return contextMenu!({
      rename_directory: id !== workspaceId,
      delete_directory: id !== workspaceId,
    })
  })

  const memoedCollapseProps = useMemo(() => {
    return {
      bordered: false,
      className: classNames(styles.collapse),
      ...collapseProps,
    }
  }, [collapseProps])

  const labelRender = useMemoizedFn((label: ReactNode) => {
    return (
      <div className='flex items-center space-x-1'>
        <div className='flex items-center'>{fnStrategy(data.nodeType).icon({ path: resolvedId })}</div>
        {label}
      </div>
    )
  })

  if (!data)
    return null

  return (
    <ImageCollapse
      key={resolvedId}
      id={resolvedId}
      collapseProps={memoedCollapseProps}
      collapsible={collapsible}
      // 不能折叠时，强制展开
      forceOpen={!collapsible ? true : undefined}
      labelRender={labelRender}
      contextMenu={contextMenu ? memoedContextMenu : undefined}
      label={data.path!}
      images={data.images}
      workspaceFolder={workspaceFolder}
      folderImages={treeManager?.getNodeImages(id)}
      subfolderImages={treeManager?.getSubnodeImages(id)}
      tooltipDisplayFullPath={!displayGroup.includes(DisplayGroupType.dir)}
    >
      {data.path && tree ? renderTree(tree) : null}
    </ImageCollapse>
  )
}

export default memo(MemoCollapse)
