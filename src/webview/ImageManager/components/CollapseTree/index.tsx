import { useMemoizedFn } from '@minko-fe/react-hook'
import { type CollapseProps, ConfigProvider } from 'antd'
import classNames from 'classnames'
import { memo, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FaRegImages } from 'react-icons/fa'
import { FaRegObjectGroup } from 'react-icons/fa6'
import { IoMdFolderOpen } from 'react-icons/io'
import { PiFileImage } from 'react-icons/pi'
import GlobalContext from '../../contexts/GlobalContext'
import SettingsContext from '../../contexts/SettingsContext'
import TreeContext from '../../contexts/TreeContext'
import { DirTree, type FileNode } from '../../utils/DirTree'
import ImageCollapse from '../ImageCollapse'
import OpenFolder from './components/OpenFolder'
import styles from './index.module.css'

function CollapseTree() {
  const { displayGroup, displayStyle } = SettingsContext.usePicker(['displayGroup', 'displayStyle'])

  const { dirs, imageType, workspaceFolders } = TreeContext.usePicker([
    'imageSingleTree',
    'dirs',
    'imageType',
    'workspaceFolders',
  ])

  const visibleList = TreeContext.useSelector((ctx) => ctx.imageSingleTree.visibleList)

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
                  className: classNames(styles.collapse),
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
      visibleList,
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
