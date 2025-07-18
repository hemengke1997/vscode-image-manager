import type { Workspace } from '../../stores/image/image-store'
import type { NestedTreeNode } from '../../utils/tree/tree-manager'
import { useMemoizedFn } from 'ahooks'
import { ConfigProvider } from 'antd'
import { flatten, isSubset } from 'es-toolkit'
import { produce } from 'immer'
import { useSetAtom } from 'jotai'
import { memo, startTransition, useEffect, useRef, useState } from 'react'
import { DisplayGroupType, DisplayStyleType } from '~/core/persist/workspace/common'
import logger from '~/utils/logger'
import useUpdateDeepEffect from '../../hooks/use-update-deep-effect'
import useUpdateImages from '../../hooks/use-update-images'
import { useWhyUpdateDebug } from '../../hooks/use-why-update-debug'
import { ActionAtoms } from '../../stores/action/action-store'
import { useImageFilter } from '../../stores/action/hooks'
import { GlobalAtoms } from '../../stores/global/global-store'
import { useDisplayGroup, useDisplayStyle, useSort } from '../../stores/settings/hooks'
import { UpdateType } from '../../utils/tree/const'
import { TreeStyle } from '../../utils/tree/tree'
import { TreeManager } from '../../utils/tree/tree-manager'
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

  useWhyUpdateDebug('CollapseTree', props)

  const { resetPartialState } = useUpdateImages()

  const treeManager = useRef<TreeManager>()

  const setWorkspaceImages = useSetAtom(GlobalAtoms.workspaceImagesAtom)
  const [nestedTree, setNestedTree] = useState<NestedTreeNode[]>()

  const [displayGroup] = useDisplayGroup()
  const [displayStyle] = useDisplayStyle()
  const [sort] = useSort()

  const [imageFilter] = useImageFilter()

  const notifyCollapseChange = useSetAtom(ActionAtoms.notifyCollapseChange)

  const afterUpdate = useMemoizedFn(async () => {
    const nestedTree = await treeManager.current?.toNestedArray()
    resetPartialState()
    setNestedTree(nestedTree || [])

    // 获取当前工作区的可见图片列表
    const images = flatten(treeManager.current!.toArray(nestedTree || [], node => node.data.images || []))
    setWorkspaceImages(
      produce((draft) => {
        const index = draft.findIndex(t => t.workspaceFolder === workspace.workspaceFolder)
        if (index !== -1) {
          draft[index].images = images
        }
        else {
          draft.push({ workspaceFolder: workspace.workspaceFolder, images })
        }
      }),
    )
    startTransition(() => {
    // TODO：不一定生效
      notifyCollapseChange()
    })
  })

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

  const generateRenderTree = useMemoizedFn(() => {
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

  useEffect(() => {
    if (workspace.images.length && workspace.update) {
      switch (workspace.update.type) {
        case UpdateType.patch:
          treeManager.current?.updateTree(workspace.update.payloads)
          break
        case UpdateType.full:
          generateRenderTree()
          break
        default:
          break
      }

      afterUpdate()
    }
  }, [workspace.images, workspace.update])

  useUpdateDeepEffect(() => {
    if (workspace.images.length) {
      generateRenderTree()
      afterUpdate()
    }
  }, [displayGroup, displayStyle, imageFilter, sort])

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
        tree={nestedTree}
        treeManager={treeManager.current}
        workspaceFolder={workspace.workspaceFolder}
        workspaceId={workspace.absWorkspaceFolder}
      />
    </ConfigProvider>
  )
}

export default memo(CollapseTree)
