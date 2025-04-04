import { memo, startTransition, useEffect, useRef, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { ConfigProvider } from 'antd'
import { flatten, isSubset } from 'es-toolkit'
import { produce } from 'immer'
import { DisplayGroupType, DisplayStyleType } from '~/core/persist/workspace/common'
import logger from '~/utils/logger'
import useUpdateImages from '../../hooks/use-update-images'
import FilterStore from '../../stores/filter-store'
import GlobalStore, { type Workspace } from '../../stores/global-store'
import SettingsStore from '../../stores/settings-store'
import { UpdateType } from '../../utils/tree/const'
import { TreeStyle } from '../../utils/tree/tree'
import { type NestedTreeNode, TreeManager } from '../../utils/tree/tree-manager'
import TreeRenderer from './components/tree-renderer'

type Props = {
  workspace: Workspace
}

/**
 * NOTE: 此重组件在大量图片时，会有性能问题，因为每次都会重新计算树结构。
 * 所以尽量保证，这个组件中的状态和方法是稳定的。
 * 把经常变动的状态下沉，由轻量子组件处理。
 */
function CollapseTree(props: Props) {
  const { workspace } = props
  const { resetPartialState } = useUpdateImages()

  const { setWorkspaceImages } = GlobalStore.useStore(['setWorkspaceImages'])
  const { displayGroup, displayStyle, sort } = SettingsStore.useStore(['displayGroup', 'displayStyle', 'sort'])

  const { imageFilter } = FilterStore.useStore(['imageFilter'])

  const afterUpdate = useMemoizedFn(() => {
    const nestedTree = treeManager.current?.toNestedArray()
    resetPartialState()
    setNestedTree(nestedTree)

    // 获取当前工作区的可见图片列表
    startTransition(() => {
      const images = flatten(treeManager.current!.toArray(nestedTree || [], (node) => node.data.images || []))
      setWorkspaceImages(
        produce((draft) => {
          const index = draft.findIndex((t) => t.workspaceFolder === workspace.workspaceFolder)
          if (index !== -1) {
            draft[index].images = images
          } else {
            draft.push({ workspaceFolder: workspace.workspaceFolder, images })
          }
        }),
      )
    })
  })

  useEffect(() => {
    if (workspace.images.length && workspace.update) {
      switch (workspace.update.type) {
        case UpdateType.patch:
          treeManager.current?.updateTree(workspace.update.payloads)
          break
        case UpdateType.full:
          generateTree()
          break
        default:
          break
      }

      afterUpdate()
    }
  }, [workspace.images, workspace.update])

  useEffect(() => {
    if (workspace.images.length) {
      generateTree()
      afterUpdate()
    }
  }, [displayGroup, displayStyle, imageFilter, sort])

  const displayGroupToTreeStyle = useMemoizedFn((group: DisplayGroupType[]) => {
    if (isSubset(group, [DisplayGroupType.dir, DisplayGroupType.extname])) {
      return TreeStyle.dir_extension
    }
    if (isSubset(group, [DisplayGroupType.dir])) {
      return TreeStyle.dir
    }
    if (isSubset(group, [DisplayGroupType.extname])) {
      return TreeStyle.extension
    }
    return TreeStyle.flat
  })

  const [nestedTree, setNestedTree] = useState<NestedTreeNode[]>()
  const treeManager = useRef<TreeManager>()

  const generateTree = useMemoizedFn(() => {
    const treeStyle = displayGroupToTreeStyle(displayGroup)

    const isCompact = displayStyle === DisplayStyleType.compact
    logger.debug('紧凑模式: ', isCompact)

    treeManager.current = new TreeManager(workspace.workspaceFolder, {
      compact: isCompact,
      filter: imageFilter,
      sort,
      treeStyle,
    })

    treeManager.current?.generateTree(workspace.images)
  })

  return (
    <ConfigProvider
      theme={{
        components: {
          Collapse: {
            lineWidth: 0,
          },
        },
      }}
    >
      <TreeRenderer
        tree={nestedTree || []}
        treeManager={treeManager.current}
        workspaceFolder={workspace.workspaceFolder}
        workspaceId={workspace.absWorkspaceFolder}
      />
    </ConfigProvider>
  )
}

export default memo(CollapseTree)
