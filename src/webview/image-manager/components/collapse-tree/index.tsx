import { memo, type ReactNode, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FaRegImages } from 'react-icons/fa6'
import { VscFileMedia } from 'react-icons/vsc'
import { Transition } from 'react-transition-preset'
import { useMemoizedFn } from 'ahooks'
import { Card, type CollapseProps, ConfigProvider, Empty } from 'antd'
import { isNil } from 'es-toolkit'
import { classNames } from 'tw-clsx'
import { DisplayGroupType, DisplayStyleType } from '~/core/persist/workspace/common'
import ActionStore from '../../stores/action-store'
import TreeStore from '../../stores/tree-store'
import { DirTree, type DisplayMapType, type FileNode } from '../../utils/dir-tree'
import { ANIMATION_DURATION } from '../../utils/duration'
import { type EnableCollapseContextMenuType } from '../context-menus/components/collapse-context-menu'
import ImageCollapse from './components/image-collapse'
import RevealInFolder from './components/reveal-in-folder'
import styles from './index.module.css'

type TreeExtraProps = {
  /**
   * 节点当前目录下的所有图片（不包括子目录）
   */
  subfolderImages?: ImageType[]
  /**
   * 节点当前目录下的所有图片（包括子目录）
   */
  allSubfolderImages?: ImageType[]
}

/**
 * 扩展节点属性并注入满足条件的图片
 * @param node
 * @param image
 * @param key
 * @param conditions
 */
function injectSubfolderImagesToNode(
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
    </div>
  )
}

type Props = {
  displayGroup: DisplayGroupType[]
  displayStyle: DisplayStyleType
  multipleWorkspace: boolean
}

/**
 * NOTE: 此重组件在大量图片时，会有性能问题，因为每次都会重新计算树结构。
 * 所以尽量保证，这个组件中的状态和方法是稳定的。
 * 把经常变动的状态下沉，由轻量子组件处理。
 */
function CollapseTree(props: Props) {
  const { displayGroup, displayStyle, multipleWorkspace } = props
  const { t } = useTranslation()

  const { dirs, imageTypes, workspaceFolder, originalWorkspaceFolder, workspaceId } = TreeStore.useStore([
    'dirs',
    'imageTypes',
    'workspaceFolder',
    'originalWorkspaceFolder',
    'workspaceId',
  ])

  const visibleList = TreeStore.useStore((ctx) => ctx.imageSingleTree.visibleList)

  const { collapseIdSet } = ActionStore.useStore(['collapseIdSet'])

  const dirTree = useRef<DirTree<TreeExtraProps>>()

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

  const displayMap: DisplayMapType<{
    icon: (props: { path: string }) => ReactNode
    contextMenu: (contextMenu: EnableCollapseContextMenuType) => EnableCollapseContextMenuType
  }> = useMemo(
    () => ({
      [DisplayGroupType.workspace]: {
        imageKey: 'absWorkspaceFolder',
        list: [workspaceFolder].filter(Boolean),
        icon: (props: { path: string }) => <RevealGroup {...props} />,
        contextMenu: getContextMenu,
        priority: 1,
      },
      [DisplayGroupType.dir]: {
        imageKey: 'absDirPath',
        list: dirs,
        icon: (props: { path: string }) => <RevealGroup {...props} />,
        contextMenu: getContextMenu,
        priority: 2,
      },
      [DisplayGroupType.extname]: {
        imageKey: 'extname',
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
            const { groupType, value, label, children, renderList, subfolderImages, allSubfolderImages } = node
            collapseIdSet.current.add(value)
            if (!groupType) return null

            // 非根节点，或者多工作区时，可以折叠
            const collapsible = !root || multipleWorkspace

            return (
              <ImageCollapse
                key={value}
                id={value}
                collapseProps={{
                  bordered: false,
                  className: classNames(styles.collapse),
                  ...collapseProps,
                }}
                collapsible={collapsible}
                // 不能折叠时，强制展开
                forceOpen={!collapsible}
                labelRender={(label) => (
                  <div className={'flex items-center space-x-1'}>
                    <div className={'flex items-center'}>{displayMap[groupType].icon({ path: value })}</div>
                    {label}
                  </div>
                )}
                contextMenu={(id) => ({
                  // 工作区节点不显示修改目录名和删除目录
                  ...displayMap[groupType].contextMenu({
                    rename_directory: id !== workspaceId,
                    delete_directory: id !== workspaceId,
                  }),
                })}
                label={label}
                joinLabel={!!displayMap[groupType].priority}
                images={renderList}
                subfolderImages={subfolderImages}
                allSubfolderImages={allSubfolderImages}
                tooltipDisplayFullPath={!displayGroup.includes(DisplayGroupType.dir)}
              >
                {label ? nestedDisplay(children) : null}
              </ImageCollapse>
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
          injectSubfolderImagesToNode(node, image, 'subfolderImages', {
            type: shouldRender,
            dir: image.absDirPath === node.value,
          })

          const split = image.absDirPath.split(node.value)
          injectSubfolderImagesToNode(node, image, 'allSubfolderImages', {
            type: shouldRender,
            dir: split.length === 2 && (split[1].startsWith('/') || split[1] === ''),
          })
        },
      },
    )

    const tree = dirTree.current.buildRenderTree()

    if (displayStyle === DisplayStyleType.compact) {
      dirTree.current.compactFolders(tree)
    }

    if (!tree.length) {
      return (
        <Transition mounted={true} initial={true} enterDelay={ANIMATION_DURATION.fast}>
          {(style) => (
            <div style={style}>
              <Card
                title={<div className={'text-ant-color-warning'}>{originalWorkspaceFolder}</div>}
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
