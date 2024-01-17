import { useMemoizedFn } from '@minko-fe/react-hook'
import { type CollapseProps, ConfigProvider } from 'antd'
import { memo, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FaRegImages } from 'react-icons/fa'
import { FaRegObjectGroup } from 'react-icons/fa6'
import { IoMdFolderOpen } from 'react-icons/io'
import { PiFileImage } from 'react-icons/pi'
import GlobalContext from '../../contexts/GlobalContext'
import TreeContext from '../../contexts/TreeContext'
import { DirTree, type FileNode } from '../../utils/DirTree'
import { type GroupType } from '../DisplayGroup'
import { type DisplayStyleType } from '../DisplayStyle'
import ImageCollapse from '../ImageCollapse'
import OpenFolder from './components/OpenFolder'
import styles from './index.module.css'

type GroupOption = Option

type CollapseTreeProps = {
  workspaceFolders: GroupOption[]
  dirs: GroupOption[]
  imageType: GroupOption[]
  displayGroup: GroupType[]
  displayStyle: DisplayStyleType
}

function CollapseTree(props: CollapseTreeProps) {
  const { workspaceFolders, dirs, imageType, displayGroup, displayStyle } = props
  const { imageSingleTree } = TreeContext.usePicker(['imageSingleTree'])
  const allWorkspaceFolders = GlobalContext.useSelector((ctx) => ctx.imageState.workspaceFolders)

  const { t } = useTranslation()

  const dirTree = useRef<DirTree>()

  const displayMap = useMemo(
    () => ({
      workspace: {
        imageKeys: {
          absolutePath: 'absWorkspaceFolder',
          relativePath: 'workspaceFolder',
        },
        list: workspaceFolders,
        icon: (props: { path: string }) => (
          <OpenFolder {...props}>
            <FaRegObjectGroup />
          </OpenFolder>
        ),
        contextMenu: true,
        priority: 1,
      },
      dir: {
        imageKeys: {
          absolutePath: 'absDirPath',
          relativePath: 'dirPath',
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
        imageKeys: {
          absolutePath: 'fileType',
          relativePath: 'fileType',
        },
        list: imageType,
        icon: () => <PiFileImage />,
        contextMenu: false,
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
    [workspaceFolders, dirs, imageType],
  )

  const nestedDisplay = useMemoizedFn(
    (
      tree: FileNode[],
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
            return (
              <ImageCollapse
                key={node.value}
                id={node.value}
                collapseProps={{
                  bordered: false,
                  defaultActiveKey: defaultOpen ? [node.value] : undefined,
                  collapsible: 'header',
                  className: styles.collapse,
                  ...collapseProps,
                }}
                labelContainer={(label) => (
                  <div className={'flex items-center space-x-2'}>
                    <div className={'flex-center'}>{displayMap[node.type!].icon({ path: node.value })}</div>
                    {label}
                  </div>
                )}
                contextMenu={displayMap[node.type!].contextMenu}
                label={node.label}
                joinLabel={!!displayMap[node.type!].priority}
                images={node.renderList || []}
                nestedChildren={node.label ? nestedDisplay(node.children) : null}
              ></ImageCollapse>
            )
          })}
        </div>
      )
    },
  )

  const displayByPriority = useMemoizedFn(() => {
    dirTree.current = new DirTree({
      displayGroup,
      displayMap,
      visibleList: imageSingleTree.visibleList,
    })

    let tree = dirTree.current.buildRenderTree()

    if (!tree.length) {
      tree = [
        {
          label: t('im.all'),
          type: 'all',
          fullLabel: '',
          value: workspaceFolders.length ? workspaceFolders[0].value : allWorkspaceFolders[0],
          children: [],
          renderCondition: {},
        },
      ]
    }

    if (displayStyle === 'compact') {
      dirTree.current.compactFolders(tree)
    }

    console.log('renderTree: ', tree)

    // render tree
    return nestedDisplay(tree, { bordered: true }, { defaultOpen: true })
  })

  return (
    <>
      <ConfigProvider>{displayByPriority()}</ConfigProvider>
    </>
  )
}

export default memo(CollapseTree)
