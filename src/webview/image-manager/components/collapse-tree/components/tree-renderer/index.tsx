import type { CollapseProps } from 'antd'
import type { NestedTreeNode, TreeManager } from '~/webview/image-manager/utils/tree/tree-manager'
import { useMemoizedFn } from 'ahooks'
import { Card } from 'antd'
import { isUndefined } from 'es-toolkit'
import { motion } from 'motion/react'
import { memo, useDeferredValue } from 'react'
import EmptyImage from '~/webview/image-manager/components/empty'
import { useWhyUpdateDebug } from '~/webview/image-manager/hooks/use-why-update-debug'
import { ANIMATION_DURATION } from '~/webview/image-manager/utils/duration'
import MemoCollapse from './components/memo-collapse'

type Props = {
  tree: NestedTreeNode[] | undefined
  treeManager: TreeManager | undefined
  workspaceId: string
  workspaceFolder: string
}

function TreeRenderer(props: Props) {
  const { tree: _tree, treeManager, workspaceFolder, workspaceId } = props

  useWhyUpdateDebug('TreeRenderer', props)

  // 使用 useDeferredValue 延迟更新，避免阻塞主线程
  const tree = useDeferredValue(_tree)

  /**
   * nodeID是以工作区名称开头的，需要去掉工作区名称，然后加上工作区绝对路径
   * @returns 目录的完整路径
   */
  const resolvePath = useMemoizedFn((nodeId: string) => {
    if (nodeId === workspaceFolder)
      return workspaceId

    return nodeId.replace(new RegExp(`^${workspaceFolder}`), `${workspaceId}`)
  })

  const renderNestedTree = useMemoizedFn(
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

            return (
              <MemoCollapse
                key={resolvedId}
                resolvedId={resolvedId}
                data={data}
                id={id}
                tree={children}
                renderTree={renderNestedTree}
                treeManager={treeManager}
                workspaceId={workspaceId}
                workspaceFolder={workspaceFolder}
                collapseProps={collapseProps}
                isRoot={root}
              />
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
          <EmptyImage />
        </Card>
      </motion.div>
    )
  }

  // render tree
  return renderNestedTree(tree, { bordered: true }, { root: true })
}

export default memo(TreeRenderer)
