import { memo, type ReactNode, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useMemoizedFn } from 'ahooks'
import { Card, type CollapseProps, ConfigProvider, Empty } from 'antd'
import { motion } from 'framer-motion'
import { isNil } from 'lodash-es'
import { FaRegImages } from 'react-icons/fa6'
import { VscFileMedia } from 'react-icons/vsc'
import { classNames } from 'tw-clsx'
import { type DisplayGroupType, type DisplayStyleType } from '~/core/persist/workspace/common'
import { getAppRoot } from '~/webview/utils'
import ActionContext from '../../contexts/action-context'
import TreeContext from '../../contexts/tree-context'
import { DirTree, type DisplayMapType, type FileNode } from '../../utils/dir-tree'
import { ANIMATION_DURATION } from '../../utils/duration'
import { type EnableCollapseContextMenuType } from '../context-menus/components/collapse-context-menu'
import ImageCollapse from '../image-collapse'
// import RevealInExplorer from './components/reveal-in-explorer'
import RevealInFolder from './components/reveal-in-folder'
import styles from './index.module.css'

type TreeExtraProps = {
  /**
   * 节点当前目录下的所有图片（不包括子目录）
   */
  underFolderList?: ImageType[]
  /**
   * 节点当前目录下的所有图片（包括子目录）
   */
  underFolderDeeplyList?: ImageType[]
}

/**
 * 扩展节点属性并注入满足条件的图片
 * @param node
 * @param image
 * @param key
 * @param conditions
 */
function injectUnderfolderImagesToNode(
  node: FileNode,
  image: ImageType,
  key: keyof TreeExtraProps,
  conditions: {
    type: boolean
    dir: boolean
  },
) {
  if (!node[key]) {
    node[key] = []
  }

  if (!isNil(node.renderCondition.type) && !isNil(node.renderCondition.dir)) {
    // 按目录和类型分组

    if (conditions.type || conditions.dir) {
      node[key].push(image)
    }
  } else if (!isNil(node.renderCondition.type)) {
    // 按类型分组
    // 其实就是renderList
    if (conditions.type) {
      node[key].push(image)
    }
  } else if (!isNil(node.renderCondition.dir)) {
    // 按目录分组
    if (conditions.dir) {
      node[key].push(image)
    }
  }
}

function RevealGroup(props: { path: string; folderChildren?: ReactNode }) {
  return (
    <div className={'flex items-center gap-x-1'}>
      <RevealInFolder {...props}>{props.folderChildren}</RevealInFolder>
      {/* <RevealInExplorer {...props} /> */}
    </div>
  )
}

type Props = {
  displayGroup: DisplayGroupType[]
  displayStyle: DisplayStyleType
  multipleWorkspace: boolean
}

function CollapseTree(props: Props) {
  const { displayGroup, displayStyle, multipleWorkspace } = props
  const { t } = useTranslation()

  const { dirs, imageTypes, workspaceFolder, originalWorkspaceFolder } = TreeContext.usePicker([
    'dirs',
    'imageTypes',
    'workspaceFolder',
    'originalWorkspaceFolder',
  ])

  const visibleList = TreeContext.useSelector((ctx) => ctx.imageSingleTree.visibleList)

  const { collapseIdSet } = ActionContext.usePicker(['collapseIdSet'])

  const dirTree = useRef<DirTree<TreeExtraProps>>()

  const getContextMenu = useMemoizedFn((root: boolean) => {
    return {
      compress_in_current_directory: true,
      compress_in_recursive_directories: true,
      format_conversion_in_current_directory: true,
      format_conversion_in_recursive_directories: true,
      open_in_os_explorer: true,
      open_in_vscode_explorer: true,
      rename_directory: !root,
      delete_directory: !root,
    }
  })

  const displayMap: DisplayMapType<{
    icon: (props: { path: string }) => ReactNode
    contextMenu: (root: boolean) => EnableCollapseContextMenuType
  }> = useMemo(
    () => ({
      workspace: {
        imageKey: {
          id: 'absWorkspaceFolder',
        },
        list: [workspaceFolder].filter(Boolean),
        icon: (props: { path: string }) => <RevealGroup {...props} />,
        contextMenu: getContextMenu,
        priority: 1,
      },
      dir: {
        imageKey: {
          id: 'absDirPath',
        },
        list: dirs,
        icon: (props: { path: string }) => <RevealGroup {...props} />,
        contextMenu: getContextMenu,
        priority: 2,
      },
      type: {
        imageKey: {
          id: 'fileType',
        },
        list: imageTypes,
        icon: () => <VscFileMedia className={'mr-1'} />,
        contextMenu: () => ({
          open_in_os_explorer: false,
          open_in_vscode_explorer: false,
          compress_in_recursive_directories: false,
          format_conversion_in_recursive_directories: false,
          delete_directory: false,
          rename_directory: false,
        }),
        priority: 3,
      },
      // Special case, when no group checked, show all images
      all: {
        icon: (props: { path: string }) => <RevealGroup {...props} folderChildren={<FaRegImages />} />,
        contextMenu: getContextMenu,
        priority: null,
      },
    }),
    [workspaceFolder, dirs, imageTypes, getContextMenu],
  )

  const nestedDisplay = useMemoizedFn(
    (
      tree: (FileNode & TreeExtraProps)[],
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
            const { groupType, value, label, children, renderList, underFolderList, underFolderDeeplyList } = node
            collapseIdSet.current.add(value)
            if (!groupType) return null

            return (
              <ImageCollapse
                key={value}
                id={value}
                collapseProps={{
                  bordered: false,
                  className: classNames(styles.collapse),
                  // 多工作区时，顶部目录可以关闭，否则不可关闭
                  [multipleWorkspace ? 'defaultActiveKey' : 'activeKey']: root ? [value] : undefined,
                  ...collapseProps,
                }}
                collapsible={root && multipleWorkspace}
                labelRender={(label) => (
                  <div className={'flex items-center space-x-1'}>
                    <div className={'flex items-center'}>{displayMap[groupType].icon({ path: value })}</div>
                    {label}
                  </div>
                )}
                contextMenu={{
                  ...displayMap[groupType].contextMenu(!!root),
                }}
                label={label}
                joinLabel={!!displayMap[groupType].priority}
                nestedChildren={label ? nestedDisplay(children) : null}
                images={renderList}
                underFolderImages={underFolderList}
                underFolderDeeplyImages={underFolderDeeplyList}
                imagePreviewProps={{
                  enableMultipleSelect: true,
                  lazyImageProps: {
                    lazy: {
                      root: getAppRoot(),
                    },
                    contextMenu: {
                      enable: {
                        sharp: true,
                        fs: true,
                      },
                    },
                    imageNameProps: {
                      tooltipDisplayFullPath: !displayGroup.includes('dir'),
                    },
                  },
                }}
              ></ImageCollapse>
            )
          })}
        </div>
      )
    },
  )

  const displayByPriority = useMemoizedFn(() => {
    dirTree.current = new DirTree(
      {
        displayGroup,
        displayMap,
        visibleList,
      },
      {
        onFilterImages(node, image, shouldRender) {
          injectUnderfolderImagesToNode(node, image, 'underFolderList', {
            type: shouldRender,
            dir: image.absDirPath === node.value,
          })

          const split = image.absDirPath.split(node.value)
          injectUnderfolderImagesToNode(node, image, 'underFolderDeeplyList', {
            type: shouldRender,
            dir: split.length === 2 && (split[1].startsWith('/') || split[1] === ''),
          })
        },
      },
    )

    const tree = dirTree.current.buildRenderTree()

    if (displayStyle === 'compact') {
      dirTree.current.compactFolders(tree)
    }

    if (!tree.length) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: ANIMATION_DURATION.fast, delay: ANIMATION_DURATION.fast }}
        >
          <Card
            title={<div className={'text-ant-color-warning'}>{originalWorkspaceFolder}</div>}
            bordered={false}
            type='inner'
          >
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('im.no_image')} />
          </Card>
        </motion.div>
      )
    }

    // render tree
    return nestedDisplay(tree, { bordered: true }, { root: true })
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
      {displayByPriority()}
    </ConfigProvider>
  )
}

export default memo(CollapseTree)
