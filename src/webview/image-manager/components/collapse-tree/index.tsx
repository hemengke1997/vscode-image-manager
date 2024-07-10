import { isNil } from '@minko-fe/lodash-pro'
import { useMemoizedFn } from '@minko-fe/react-hook'
import { Card, type CollapseProps, ConfigProvider, Empty } from 'antd'
import { motion } from 'framer-motion'
import { type ReactNode, memo, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FaRegImages } from 'react-icons/fa'
import { IoMdFolderOpen } from 'react-icons/io'
import { VscFileMedia } from 'react-icons/vsc'
import { classnames } from 'tw-clsx'
import { type WorkspaceStateType } from '~/core/persist/workspace/common'
import { getAppRoot } from '~/webview/utils'
import TreeContext from '../../contexts/tree-context'
import { DirTree, type DisplayMapType, type FileNode } from '../../utils/dir-tree'
import { ANIMATION_DURATION } from '../../utils/duration'
import { type EnableCollapseContextMenuType } from '../context-menus/components/collapse-context-menu'
import ImageCollapse from '../image-collapse'
import OpenFolder from './components/open-folder'
import styles from './index.module.css'

type CollapseTreeProps = {
  displayGroup: WorkspaceStateType['display_group']
  displayStyle: WorkspaceStateType['display_style']
}

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

function CollapseTree(props: CollapseTreeProps) {
  const { displayGroup, displayStyle } = props
  const { t } = useTranslation()

  const { dirs, imageTypes, workspaceFolder, originalWorkspaceFolder } = TreeContext.usePicker([
    'dirs',
    'imageTypes',
    'workspaceFolder',
    'originalWorkspaceFolder',
  ])

  const visibleList = TreeContext.useSelector((ctx) => ctx.imageSingleTree.visibleList)

  const dirTree = useRef<DirTree<TreeExtraProps>>()

  const displayMap: DisplayMapType<{
    icon: (props: { path: string }) => ReactNode
    contextMenu: EnableCollapseContextMenuType
  }> = useMemo(
    () => ({
      workspace: {
        imageKey: {
          id: 'absWorkspaceFolder',
        },
        list: [workspaceFolder].filter(Boolean),
        icon: (props: { path: string }) => (
          <OpenFolder {...props}>
            <IoMdFolderOpen />
          </OpenFolder>
        ),
        contextMenu: true,
        priority: 1,
      },
      dir: {
        imageKey: {
          id: 'absDirPath',
        },
        list: dirs,
        icon: (props: { path: string }) => (
          <OpenFolder {...props}>
            <IoMdFolderOpen />
          </OpenFolder>
        ),
        contextMenu: true,
        priority: 2,
      },
      type: {
        imageKey: {
          id: 'fileType',
        },
        list: imageTypes,
        icon: () => <VscFileMedia className={'mr-1'} />,
        contextMenu: {
          open_in_os_explorer: false,
          open_in_vscode_explorer: false,
          compress_in_recursive_directories: false,
          format_conversion_in_recursive_directories: false,
          delete_directory: false,
          rename_directory: false,
        },
        priority: 3,
      },
      // Special case, when no group checked, show all images
      all: {
        icon: (props: { path: string }) => (
          <OpenFolder {...props}>
            <FaRegImages />
          </OpenFolder>
        ),
        contextMenu: true,
        priority: null,
      },
    }),
    [workspaceFolder, dirs, imageTypes],
  )

  const nestedDisplay = useMemoizedFn(
    (
      tree: (FileNode & TreeExtraProps)[],
      collapseProps?: CollapseProps,
      options?: {
        defaultOpen?: boolean
      },
    ) => {
      if (!tree.length) return null

      const { defaultOpen } = options || {}

      return (
        <div className={'space-y-2'}>
          {tree.map((node) => {
            const { groupType, value, label, children, renderList, underFolderList, underFolderDeeplyList } = node
            if (!groupType) return null
            return (
              <ImageCollapse
                key={value}
                id={value}
                collapseProps={{
                  bordered: false,
                  defaultActiveKey: defaultOpen ? [value] : undefined,
                  className: classnames(styles.collapse),
                  ...collapseProps,
                }}
                labelRender={(label) => (
                  <div className={'flex items-center space-x-1'}>
                    <div className={'flex items-center'}>{displayMap[groupType].icon({ path: value })}</div>
                    {label}
                  </div>
                )}
                contextMenu={displayMap[groupType].contextMenu}
                label={label}
                joinLabel={!!displayMap[groupType].priority}
                nestedChildren={label ? nestedDisplay(children) : null}
                images={renderList}
                underFolderImages={underFolderList}
                underFolderDeeplyImages={underFolderDeeplyList}
                imagePreviewProps={{
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

          injectUnderfolderImagesToNode(node, image, 'underFolderDeeplyList', {
            type: shouldRender,
            dir: image.absDirPath.startsWith(node.value),
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
    return nestedDisplay(tree, { bordered: true }, { defaultOpen: true })
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
